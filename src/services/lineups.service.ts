import { Lineup } from "../models/Lineup.js";
import { Team } from "../models/Team.js";
import { AppError } from "../lib/errors.js";
import { LineupStatus } from "../models/enums.js";
import { appEmitter } from "../events/emitter.js";

export async function getLineup(userId: string, tournamentId: string) {
  const lineup = await Lineup.findOne({ userId, tournamentId })
    .populate("starters")
    .populate("reserves")
    .lean();
  return lineup ?? null;
}

export interface SetLineupBody {
  starters: string[];
  reserves: string[];
}

export async function setLineup(
  userId: string,
  tournamentId: string,
  body: SetLineupBody,
): Promise<void> {
  if (body.starters.length !== 4 || body.reserves.length !== 3)
    throw new AppError("BAD_REQUEST", "Must have 4 starters and 3 reserves");
  const starterSet = new Set(body.starters);
  const reserveSet = new Set(body.reserves);
  if (starterSet.size !== 4 || reserveSet.size !== 3)
    throw new AppError(
      "BAD_REQUEST",
      "Duplicate player in starters or reserves",
    );
  for (const s of body.starters) {
    if (reserveSet.has(s))
      throw new AppError(
        "BAD_REQUEST",
        "Starters and reserves must be disjoint",
      );
  }
  const team = await Team.findOne({ userId, tournamentId }).lean();
  if (!team) throw new AppError("BAD_REQUEST", "Team not found");
  const teamIds = new Set(team.playerIds.map((id) => id.toString()));
  for (const id of [...body.starters, ...body.reserves]) {
    if (!teamIds.has(id))
      throw new AppError("BAD_REQUEST", "All players must be in your team");
  }
  let lineup = await Lineup.findOne({ userId, tournamentId });
  if (!lineup) {
    lineup = await Lineup.create({
      userId,
      tournamentId,
      starters: body.starters,
      reserves: body.reserves,
      status: LineupStatus.DRAFT,
    });
    return;
  }
  if (lineup.status !== LineupStatus.DRAFT)
    throw new AppError("BAD_REQUEST", "Can only update DRAFT lineup");
  lineup.starters = body.starters as unknown as typeof lineup.starters;
  lineup.reserves = body.reserves as unknown as typeof lineup.reserves;
  await lineup.save();
}

export async function lockLineup(
  userId: string,
  tournamentId: string,
): Promise<void> {
  const lineup = await Lineup.findOne({ userId, tournamentId });
  if (!lineup) throw new AppError("NOT_FOUND", "Lineup not found");
  if (lineup.status !== LineupStatus.DRAFT)
    throw new AppError("BAD_REQUEST", "Lineup already locked");
  lineup.status = LineupStatus.LOCKED;
  lineup.lockedAt = new Date();
  await lineup.save();
  appEmitter.emit("lineup:locked", {
    lineupId: lineup._id.toString(),
    userId,
    tournamentId,
  });
}

export async function lockAllForTournament(
  tournamentId: string,
): Promise<void> {
  const lineups = await Lineup.find({
    tournamentId,
    status: LineupStatus.DRAFT,
  });
  for (const lineup of lineups) {
    lineup.status = LineupStatus.LOCKED;
    lineup.lockedAt = new Date();
    await lineup.save();
    appEmitter.emit("lineup:locked", {
      lineupId: lineup._id.toString(),
      userId: lineup.userId.toString(),
      tournamentId,
    });
  }
}
