import type { Types } from "mongoose";
import { Lineup } from "../models/Lineup.js";
import { Team } from "../models/Team.js";
import { Tournament } from "../models/Tournament.js";
import { TournamentRegistration } from "../models/TournamentRegistration.js";
import { AppError } from "../lib/errors.js";

interface TournamentLike {
  lineupLockAt: Date;
  rosterSize: number;
}

interface TeamLike {
  playerIds: Types.ObjectId[];
}

interface LineupBody {
  starters: string[];
  reserves: string[];
}

export function isLineupLocked(tournament: TournamentLike): boolean {
  return new Date() > tournament.lineupLockAt;
}

export function validateLineup(
  body: LineupBody,
  team: TeamLike,
  tournament: TournamentLike,
): void {
  const teamPlayerSet = new Set(team.playerIds.map(String));

  const invalidStarters = body.starters.filter((id) => !teamPlayerSet.has(id));
  const invalidReserves = body.reserves.filter((id) => !teamPlayerSet.has(id));

  if (invalidStarters.length > 0 || invalidReserves.length > 0) {
    throw new AppError(
      "BAD_REQUEST",
      "All lineup players must be in your team roster",
      {
        invalidStarters,
        invalidReserves,
      },
    );
  }
}

export async function getMyLineup(
  userId: string,
  tournamentId: string,
): Promise<Record<string, unknown> | null> {
  const lineup = await Lineup.findOne({ userId, tournamentId })
    .populate("starters", "firstName lastName gender")
    .populate("reserves", "firstName lastName gender")
    .lean();
  return lineup ? (lineup as unknown as Record<string, unknown>) : null;
}

export interface SaveLineupInput {
  starters: string[];
  reserves: string[];
}

export async function saveLineup(
  userId: string,
  tournamentId: string,
  input: SaveLineupInput,
): Promise<Record<string, unknown>> {
  const { starters, reserves } = input;

  const [tournament, registration, team] = await Promise.all([
    Tournament.findById(tournamentId).lean(),
    TournamentRegistration.findOne({ userId, tournamentId }).lean(),
    Team.findOne({ userId, tournamentId }).lean(),
  ]);

  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  if (!registration) {
    throw new AppError(
      "FORBIDDEN",
      "You are not registered for this tournament",
    );
  }
  if (!team || team.playerIds.length < tournament.rosterSize) {
    throw new AppError(
      "BAD_REQUEST",
      "Complete your team roster before setting a lineup",
    );
  }
  if (isLineupLocked(tournament as unknown as TournamentLike)) {
    throw new AppError("FORBIDDEN", "Lineup window is closed");
  }

  validateLineup(
    { starters, reserves },
    team as unknown as TeamLike,
    tournament as unknown as TournamentLike,
  );

  const lineup = await Lineup.findOneAndUpdate(
    { userId, tournamentId },
    { starters, reserves, lockedAt: null },
    { upsert: true, new: true },
  );
  if (!lineup) throw new AppError("NOT_FOUND", "Lineup not found");
  return lineup.toObject();
}
