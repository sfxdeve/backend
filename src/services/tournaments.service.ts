import { Tournament } from "../models/Tournament.js";
import { AppError } from "../lib/errors.js";
import { paginationOptions, paginationMeta } from "../lib/pagination.js";
import type { PaginationQuery } from "../lib/pagination.js";
import { TournamentStatus } from "../models/enums.js";
import { appEmitter } from "../events/emitter.js";
import type { ScoringTable } from "../scoring/engine.js";

const defaultScoringTable: ScoringTable = {
  QUALIFICATION: 1,
  POOL: 2,
  MAIN_R12: 3,
  MAIN_QF: 5,
  MAIN_SF: 8,
  MAIN_3RD: 10,
  MAIN_FINAL: 13,
  bonusWin2_0: 2,
  bonusWin2_1: 1,
};

export interface ListTournamentsQuery extends PaginationQuery {
  seasonId?: string;
  gender?: string;
  status?: string;
}

export async function list(query: ListTournamentsQuery) {
  const filter: Record<string, unknown> = {};
  if (query.seasonId) filter.seasonId = query.seasonId;
  if (query.gender) filter.gender = query.gender;
  if (query.status) filter.status = query.status;
  const opts = paginationOptions(query);
  const [items, total] = await Promise.all([
    Tournament.find(filter)
      .sort({ startDate: 1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    Tournament.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, query) };
}

export async function listLive() {
  return Tournament.find({ status: TournamentStatus.LIVE })
    .sort({ startDate: 1 })
    .lean();
}

export async function getById(id: string) {
  const t = await Tournament.findById(id).lean();
  if (!t) throw new AppError("NOT_FOUND", "Tournament not found");
  return t;
}

export interface CreateTournamentBody {
  seasonId: string;
  name: string;
  location: string;
  gender: string;
  startDate: Date;
  endDate: Date;
  lineupLockAt: Date;
  rosterSize?: number;
  officialUrl?: string;
  scoringTable?: Partial<ScoringTable>;
}

export async function create(body: CreateTournamentBody) {
  const scoringTable = {
    ...defaultScoringTable,
    ...body.scoringTable,
  };
  const tournament = await Tournament.create({
    seasonId: body.seasonId,
    name: body.name,
    location: body.location,
    gender: body.gender,
    startDate: body.startDate,
    endDate: body.endDate,
    lineupLockAt: body.lineupLockAt,
    rosterSize: body.rosterSize ?? 7,
    officialUrl: body.officialUrl,
    scoringTable,
    status: TournamentStatus.UPCOMING,
  });
  return tournament.toObject();
}

export async function update(
  id: string,
  body: Partial<CreateTournamentBody>,
): Promise<void> {
  const doc = await Tournament.findById(id);
  if (!doc) throw new AppError("NOT_FOUND", "Tournament not found");
  if (doc.status !== TournamentStatus.UPCOMING)
    throw new AppError("BAD_REQUEST", "Can only update UPCOMING tournament");
  const updates: Record<string, unknown> = {};
  if (body.name != null) updates.name = body.name;
  if (body.location != null) updates.location = body.location;
  if (body.startDate != null) updates.startDate = body.startDate;
  if (body.endDate != null) updates.endDate = body.endDate;
  if (body.lineupLockAt != null) updates.lineupLockAt = body.lineupLockAt;
  if (body.rosterSize != null) updates.rosterSize = body.rosterSize;
  if (body.officialUrl != null) updates.officialUrl = body.officialUrl;
  if (body.scoringTable != null)
    updates.scoringTable = { ...doc.scoringTable, ...body.scoringTable };
  await Tournament.updateOne({ _id: id }, { $set: updates });
}

const validTransitions: Record<string, string[]> = {
  [TournamentStatus.UPCOMING]: [
    TournamentStatus.REGISTRATION_LOCKED,
    TournamentStatus.LIVE,
  ],
  [TournamentStatus.REGISTRATION_LOCKED]: [TournamentStatus.LIVE],
  [TournamentStatus.LIVE]: [TournamentStatus.COMPLETED],
  [TournamentStatus.COMPLETED]: [TournamentStatus.FINALIZED],
  [TournamentStatus.FINALIZED]: [],
};

export async function transitionStatus(
  id: string,
  newStatus: string,
): Promise<void> {
  const doc = await Tournament.findById(id);
  if (!doc) throw new AppError("NOT_FOUND", "Tournament not found");
  const allowed = validTransitions[doc.status] ?? [];
  if (!allowed.includes(newStatus))
    throw new AppError(
      "BAD_REQUEST",
      `Cannot transition from ${doc.status} to ${newStatus}`,
    );
  await Tournament.updateOne({ _id: id }, { $set: { status: newStatus } });
}

export async function forceLock(id: string): Promise<void> {
  const doc = await Tournament.findById(id);
  if (!doc) throw new AppError("NOT_FOUND", "Tournament not found");
  await Tournament.updateOne(
    { _id: id },
    {
      $set: {
        status: TournamentStatus.REGISTRATION_LOCKED,
        lineupLockAt: new Date(),
      },
    },
  );
  appEmitter.emit("tournament:locked", { tournamentId: id });
}

export async function finalize(id: string): Promise<void> {
  const doc = await Tournament.findById(id);
  if (!doc) throw new AppError("NOT_FOUND", "Tournament not found");
  await Tournament.updateOne(
    { _id: id },
    { $set: { status: TournamentStatus.FINALIZED } },
  );
  appEmitter.emit("tournament:finalized", { tournamentId: id });
}

export async function updatePriceParams(
  id: string,
  body: {
    priceVolatilityFactor?: number;
    priceFloor?: number;
    priceCap?: number;
  },
): Promise<void> {
  await Tournament.updateOne({ _id: id }, { $set: body });
}
