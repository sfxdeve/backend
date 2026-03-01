import mongoose from "mongoose";
import {
  Championship,
  Tournament,
  TournamentPair,
  Match,
  Athlete,
} from "../../models/RealWorld.js";
import {
  League,
  LeagueMembership,
  FantasyTeam,
  Lineup,
  LineupSlot,
} from "../../models/Fantasy.js";
import { AdminAuditLog } from "../../models/Admin.js";
import { TournamentStatus, LineupRole } from "../../models/enums.js";
import { AppError } from "../../lib/errors.js";
import { paginationMeta } from "../../lib/pagination.js";
import type {
  CreateTournamentBodyType,
  UpdateTournamentBodyType,
  AddPairBodyType,
  TournamentQueryParamsType,
} from "./schema.js";

export async function list(query: TournamentQueryParamsType) {
  const filter: Record<string, unknown> = {};
  if (query.championshipId) filter.championshipId = query.championshipId;
  if (query.status) filter.status = query.status;
  if (query.year) {
    filter.startDate = {
      $gte: new Date(`${query.year}-01-01`),
      $lte: new Date(`${query.year}-12-31`),
    };
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Tournament.find(filter)
      .populate("championshipId", "name gender seasonYear")
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Tournament.countDocuments(filter),
  ]);

  return {
    items,
    meta: paginationMeta(total, { page: query.page, limit: query.limit }),
  };
}

export async function getById(id: string) {
  const doc = await Tournament.findById(id)
    .populate("championshipId", "name gender seasonYear")
    .lean();
  if (!doc) throw new AppError("NOT_FOUND", "Tournament not found");
  return doc;
}

export async function create(body: CreateTournamentBodyType) {
  return Tournament.create(body);
}

export async function update(
  id: string,
  body: UpdateTournamentBodyType,
  adminId: string,
) {
  const before = await Tournament.findById(id).lean();
  if (!before) throw new AppError("NOT_FOUND", "Tournament not found");

  const doc = await Tournament.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  }).lean();

  await AdminAuditLog.create({
    adminId,
    action: "UPDATE_TOURNAMENT",
    entity: "Tournament",
    entityId: id,
    before: before as unknown as Record<string, unknown>,
    after: doc as unknown as Record<string, unknown>,
  });

  return doc;
}

export async function getPairs(tournamentId: string) {
  const doc = await Tournament.findById(tournamentId).lean();
  if (!doc) throw new AppError("NOT_FOUND", "Tournament not found");

  return TournamentPair.find({ tournamentId })
    .populate(
      "athleteAId",
      "firstName lastName gender fantacoinCost averageFantasyScore pictureUrl",
    )
    .populate(
      "athleteBId",
      "firstName lastName gender fantacoinCost averageFantasyScore pictureUrl",
    )
    .lean();
}

export async function addPair(tournamentId: string, body: AddPairBodyType) {
  const doc = await Tournament.findById(tournamentId).lean();
  if (!doc) throw new AppError("NOT_FOUND", "Tournament not found");

  if (body.athleteAId === body.athleteBId) {
    throw new AppError("BAD_REQUEST", "Athletes in a pair must be different");
  }

  // Ensure athletes belong to same championship gender
  const [athleteA, athleteB] = await Promise.all([
    Athlete.findById(body.athleteAId).lean(),
    Athlete.findById(body.athleteBId).lean(),
  ]);
  if (!athleteA || !athleteB) {
    throw new AppError("NOT_FOUND", "One or both athletes not found");
  }
  if (String(athleteA.championshipId) !== String(doc.championshipId)) {
    throw new AppError(
      "BAD_REQUEST",
      "Athlete A does not belong to this tournament's championship",
    );
  }
  if (String(athleteB.championshipId) !== String(doc.championshipId)) {
    throw new AppError(
      "BAD_REQUEST",
      "Athlete B does not belong to this tournament's championship",
    );
  }

  // §13.5: gender isolation — both athletes must match championship gender
  const championship = await Championship.findById(doc.championshipId).lean();
  if (!championship) throw new AppError("NOT_FOUND", "Championship not found");
  if (athleteA.gender !== championship.gender) {
    throw new AppError(
      "BAD_REQUEST",
      "Athlete A gender does not match championship gender",
    );
  }
  if (athleteB.gender !== championship.gender) {
    throw new AppError(
      "BAD_REQUEST",
      "Athlete B gender does not match championship gender",
    );
  }

  return TournamentPair.create({ tournamentId, ...body });
}

export async function removePair(tournamentId: string, pairId: string) {
  const result = await TournamentPair.deleteOne({
    _id: pairId,
    tournamentId,
  });
  if (result.deletedCount === 0) {
    throw new AppError("NOT_FOUND", "Pair not found in this tournament");
  }
}

export async function getBracket(tournamentId: string) {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");

  const matches = await Match.find({ tournamentId })
    .populate("pairAId")
    .populate("pairBId")
    .populate("winnerPairId")
    .lean();

  // Group by round
  const grouped: Record<string, typeof matches> = {};
  for (const match of matches) {
    if (!grouped[match.round]) grouped[match.round] = [];
    grouped[match.round].push(match);
  }

  return grouped;
}

export async function getResults(tournamentId: string) {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");

  return Match.find({ tournamentId })
    .populate({
      path: "pairAId",
      populate: [
        { path: "athleteAId", select: "firstName lastName" },
        { path: "athleteBId", select: "firstName lastName" },
      ],
    })
    .populate({
      path: "pairBId",
      populate: [
        { path: "athleteAId", select: "firstName lastName" },
        { path: "athleteBId", select: "firstName lastName" },
      ],
    })
    .sort({ round: 1 })
    .lean();
}

/**
 * Trigger lineup lock for a tournament.
 * Sets tournament status to LOCKED, then runs auto-substitution
 * for all fantasy teams in leagues scoped to this tournament's championship.
 */
export async function lockLineups(tournamentId: string, adminId: string) {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");

  if (
    tournament.status === TournamentStatus.LOCKED ||
    tournament.status === TournamentStatus.ONGOING ||
    tournament.status === TournamentStatus.COMPLETED
  ) {
    throw new AppError(
      "CONFLICT",
      "Tournament is already locked or has started",
    );
  }

  const now = new Date();
  await Tournament.updateOne(
    { _id: tournamentId },
    { status: TournamentStatus.LOCKED, lineupLockAt: now },
  );

  await AdminAuditLog.create({
    adminId,
    action: "LOCK_TOURNAMENT",
    entity: "Tournament",
    entityId: tournamentId,
    before: { status: tournament.status } as Record<string, unknown>,
    after: { status: TournamentStatus.LOCKED, lineupLockAt: now } as Record<
      string,
      unknown
    >,
  });

  await runLineupLockForTournament(tournamentId);

  return { message: "Tournament locked and lineup substitutions applied" };
}

/**
 * For each fantasy team in all leagues scoped to this championship,
 * create/update their lineup for this tournament and apply auto-substitution.
 */
async function runLineupLockForTournament(tournamentId: string) {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) return;

  // Get tournament's entry list (all registered pair athlete IDs)
  const pairs = await TournamentPair.find({ tournamentId }).lean();
  const registeredAthleteIds = new Set(
    pairs.flatMap((p) => [String(p.athleteAId), String(p.athleteBId)]),
  );

  // Find all active leagues for this championship
  const leagues = await League.find({
    championshipId: tournament.championshipId,
    status: { $ne: "COMPLETED" },
  }).lean();

  for (const league of leagues) {
    const memberships = await LeagueMembership.find({
      leagueId: league._id,
    }).lean();

    for (const membership of memberships) {
      const team = await FantasyTeam.findOne({
        leagueId: league._id,
        userId: membership.userId,
      }).lean();
      if (!team) continue;

      // Find or create lineup for this tournament
      let lineup = await Lineup.findOne({
        fantasyTeamId: team._id,
        tournamentId,
      });

      if (!lineup) {
        // No lineup submitted — reuse last valid lineup
        const lastLineup = await Lineup.findOne({
          fantasyTeamId: team._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        if (lastLineup) {
          // Clone slots from previous lineup
          const lastSlots = await LineupSlot.find({
            lineupId: lastLineup._id,
          }).lean();

          lineup = await Lineup.create({
            fantasyTeamId: team._id,
            tournamentId,
            autoGenerated: true,
          });

          if (lastSlots.length > 0) {
            await LineupSlot.insertMany(
              lastSlots.map((s) => ({
                lineupId: lineup!._id,
                athleteId: s.athleteId,
                role: s.role,
                benchOrder: s.benchOrder,
                substitutedIn: false,
                pointsScored: 0,
              })),
            );
          }
        } else {
          // No previous lineup — create empty locked lineup (0 pts)
          lineup = await Lineup.create({
            fantasyTeamId: team._id,
            tournamentId,
            autoGenerated: true,
          });
        }
      }

      // Apply auto-substitution
      await applyAutoSubstitution(String(lineup._id), registeredAthleteIds);

      // Lock the lineup
      await Lineup.updateOne(
        { _id: lineup._id },
        { isLocked: true, lockedAt: new Date() },
      );
    }
  }
}

/**
 * For each STARTER not in the entry list, promote the first eligible BENCH athlete.
 */
async function applyAutoSubstitution(
  lineupId: string,
  registeredAthleteIds: Set<string>,
) {
  const slots = await LineupSlot.find({ lineupId })
    .sort({ benchOrder: 1 })
    .lean();

  const starters = slots.filter((s) => s.role === LineupRole.STARTER);
  const bench = slots
    .filter((s) => s.role === LineupRole.BENCH)
    .sort((a, b) => (a.benchOrder ?? 99) - (b.benchOrder ?? 99));

  let benchIdx = 0;

  for (const starter of starters) {
    if (registeredAthleteIds.has(String(starter.athleteId))) continue;

    // This starter is not in the tournament entry list — substitute
    let promoted = false;
    while (benchIdx < bench.length) {
      const candidate = bench[benchIdx];
      benchIdx++;

      if (registeredAthleteIds.has(String(candidate.athleteId))) {
        // Promote candidate to STARTER
        await LineupSlot.updateOne(
          { _id: candidate._id },
          { role: LineupRole.STARTER, substitutedIn: true },
        );
        promoted = true;
        break;
      }
    }

    if (!promoted) {
      // No eligible bench athlete — original starter stays but scores 0
      // (pointsScored defaults to 0, no action needed)
    }
  }
}
