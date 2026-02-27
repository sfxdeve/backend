import mongoose from "mongoose";
import type { EntryStatus } from "../models/enums.js";
import { Tournament } from "../models/Tournament.js";
import { TournamentRegistration } from "../models/TournamentRegistration.js";
import { TournamentEntry } from "../models/TournamentEntry.js";
import { TournamentInvitation } from "../models/TournamentInvitation.js";
import { Match } from "../models/Match.js";
import { PlayerScore } from "../models/PlayerScore.js";
import { AppError } from "../lib/errors.js";
import { paginationOptions, paginationMeta } from "../lib/pagination.js";
import type { PaginationQuery } from "../lib/pagination.js";
import { computeUserTournamentScore } from "./scoring.service.js";

const leaderboardCache = new Map<
  string,
  { result: unknown; cachedAt: number }
>();
const CACHE_TTL_MS = 30_000;

/** Context for access control: who is performing the action (optional for public). */
export interface AccessContext {
  userId?: string;
  isAdmin: boolean;
}

/** Throws if the caller cannot access this tournament (private + not member/invited/admin). */
export async function assertCanAccessPrivateTournament(
  tournament: { isPublic: boolean },
  tournamentId: string,
  context: AccessContext,
  options?: { requireAuthMessage?: boolean },
): Promise<void> {
  if (tournament.isPublic) return;
  if (context.isAdmin) return;
  if (!context.userId) {
    throw options?.requireAuthMessage
      ? new AppError("UNAUTHORIZED", "Authentication required")
      : new AppError("NOT_FOUND", "Tournament not found");
  }
  const [reg, invite] = await Promise.all([
    TournamentRegistration.findOne({
      userId: context.userId,
      tournamentId,
    }).lean(),
    TournamentInvitation.findOne({
      userId: context.userId,
      tournamentId,
    }).lean(),
  ]);
  if (!reg && !invite) throw new AppError("NOT_FOUND", "Tournament not found");
}

export interface ListTournamentsFilter {
  seasonId?: string;
  gender?: string;
  status?: string;
}

export async function listTournaments(
  filter: ListTournamentsFilter,
  pagination: PaginationQuery,
  context: AccessContext,
) {
  const queryFilter: Record<string, unknown> = {};
  if (filter.seasonId) queryFilter.seasonId = filter.seasonId;
  if (filter.gender) queryFilter.gender = filter.gender;
  if (filter.status) queryFilter.status = filter.status;

  if (!context.isAdmin) {
    if (context.userId) {
      const [regIds, invitedIds] = await Promise.all([
        TournamentRegistration.find({ userId: context.userId })
          .distinct("tournamentId")
          .lean(),
        TournamentInvitation.find({ userId: context.userId })
          .distinct("tournamentId")
          .lean(),
      ]);
      const myIds = [
        ...new Set([...regIds.map(String), ...invitedIds.map(String)]),
      ];
      queryFilter.$or = [{ isPublic: true }, { _id: { $in: myIds } }];
    } else {
      queryFilter.isPublic = true;
    }
  }

  const opts = paginationOptions(pagination);
  const [tournaments, total] = await Promise.all([
    Tournament.find(queryFilter).skip(opts.skip).limit(opts.limit).lean(),
    Tournament.countDocuments(queryFilter),
  ]);
  return { data: tournaments, meta: paginationMeta(total, pagination) };
}

export async function createTournament(body: Record<string, unknown>) {
  return Tournament.create(body);
}

export async function getTournament(
  tournamentId: string,
  context: AccessContext,
  options?: { requireAuthMessage?: boolean },
) {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  await assertCanAccessPrivateTournament(
    tournament,
    tournamentId,
    context,
    options,
  );
  return tournament;
}

export async function updateTournament(
  tournamentId: string,
  body: Record<string, unknown>,
) {
  const tournament = await Tournament.findByIdAndUpdate(tournamentId, body, {
    new: true,
  });
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  return tournament;
}

export async function registerUser(tournamentId: string, userId: string) {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  if (tournament.status !== "REGISTRATION_OPEN") {
    throw new AppError("BAD_REQUEST", "Registration is not open");
  }
  const existing = await TournamentRegistration.findOne({
    userId,
    tournamentId,
  }).lean();
  if (existing) throw new AppError("CONFLICT", "Already registered");
  return TournamentRegistration.create({
    userId,
    tournamentId,
    registeredAt: new Date(),
  });
}

export async function getLeaderboard(
  tournamentId: string,
  context: AccessContext,
) {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  await assertCanAccessPrivateTournament(tournament, tournamentId, context);

  const cached = leaderboardCache.get(tournamentId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.result;
  }

  const registrations = await TournamentRegistration.find({ tournamentId })
    .populate("userId", "name email")
    .lean();

  const scores = await Promise.all(
    registrations.map(async (reg) => {
      const uid =
        reg.userId && typeof reg.userId === "object" && "_id" in reg.userId
          ? (reg.userId as { _id: unknown })._id
          : reg.userId;
      const score = await computeUserTournamentScore(String(uid), tournamentId);
      return {
        user: reg.userId,
        registeredAt: reg.registeredAt,
        total: score.total,
      };
    }),
  );

  scores.sort((a, b) => b.total - a.total);
  const result = scores.map((s, i) => ({ rank: i + 1, ...s }));
  leaderboardCache.set(tournamentId, { result, cachedAt: Date.now() });
  return result;
}

export async function getEntries(tournamentId: string, context: AccessContext) {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  await assertCanAccessPrivateTournament(tournament, tournamentId, context);

  return TournamentEntry.find({ tournamentId })
    .populate({
      path: "pairId",
      populate: [
        { path: "player1Id", select: "firstName lastName" },
        { path: "player2Id", select: "firstName lastName" },
      ],
    })
    .sort({ entryStatus: 1, seedRank: 1 })
    .lean();
}

export async function getPlayerStatuses(
  tournamentId: string,
  context: AccessContext,
) {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  await assertCanAccessPrivateTournament(tournament, tournamentId, context);

  const entries = await TournamentEntry.find({ tournamentId })
    .populate("pairId", "player1Id player2Id")
    .lean();

  const eliminatedPairIds = new Set(
    (
      await Match.find({
        tournamentId,
        isCompleted: true,
        loserId: { $exists: true, $ne: null },
      })
        .distinct("loserId")
        .lean()
    ).map((id) => String(id)),
  );

  const agg = await PlayerScore.aggregate([
    { $match: { tournamentId } },
    {
      $group: {
        _id: "$playerId",
        matchesPlayed: { $sum: 1 },
        totalPoints: { $sum: "$totalPoints" },
      },
    },
  ]);
  const scoreByPlayer = new Map(
    agg.map((r) => [
      String(r._id),
      { matchesPlayed: r.matchesPlayed, totalPoints: r.totalPoints },
    ]),
  );

  const statuses: {
    playerId: string;
    isActive: boolean;
    matchesPlayed: number;
    totalPoints: number;
  }[] = [];
  const seenPlayers = new Set<string>();

  for (const entry of entries) {
    const raw = entry.pairId as unknown;
    const pair =
      raw && typeof raw === "object" && "player1Id" in raw && "player2Id" in raw
        ? (raw as { _id: unknown; player1Id: unknown; player2Id: unknown })
        : null;
    if (!pair) continue;
    const p1 = String(pair.player1Id);
    const p2 = String(pair.player2Id);
    const pairId = String(pair._id);
    const pairEliminated = eliminatedPairIds.has(pairId);
    const scores1 = scoreByPlayer.get(p1) ?? {
      matchesPlayed: 0,
      totalPoints: 0,
    };
    const scores2 = scoreByPlayer.get(p2) ?? {
      matchesPlayed: 0,
      totalPoints: 0,
    };
    for (const [playerId, scores] of [
      [p1, scores1] as const,
      [p2, scores2] as const,
    ]) {
      if (seenPlayers.has(playerId)) continue;
      seenPlayers.add(playerId);
      statuses.push({
        playerId,
        isActive: !pairEliminated,
        matchesPlayed: scores.matchesPlayed,
        totalPoints: scores.totalPoints,
      });
    }
  }
  return statuses;
}

export async function inviteUser(tournamentId: string, targetUserId: string) {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");

  const existing = await TournamentInvitation.findOne({
    tournamentId,
    userId: targetUserId,
  }).lean();
  if (existing) return { invitation: existing, created: false };

  const invitation = await TournamentInvitation.create({
    tournamentId,
    userId: targetUserId,
  });
  return { invitation, created: true };
}

export interface BulkEntryItem {
  pairId: string;
  entryStatus: string;
  seedRank?: number;
  reserveOrder?: number;
}

export async function bulkUpsertEntries(
  tournamentId: string,
  entries: BulkEntryItem[],
) {
  const tid = new mongoose.Types.ObjectId(tournamentId);
  const ops = entries.map((e) => {
    const pairId = new mongoose.Types.ObjectId(e.pairId);
    return {
      updateOne: {
        filter: { tournamentId: tid, pairId },
        update: {
          $set: {
            tournamentId: tid,
            pairId,
            entryStatus: e.entryStatus as EntryStatus,
            ...(e.seedRank != null && { seedRank: e.seedRank }),
            ...(e.reserveOrder != null && { reserveOrder: e.reserveOrder }),
          },
        },
        upsert: true,
      },
    };
  });
  await TournamentEntry.bulkWrite(ops);
  return { message: "Entries updated" };
}
