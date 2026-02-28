import { Team } from "../models/Team.js";
import { Tournament } from "../models/Tournament.js";
import { TournamentRegistration } from "../models/TournamentRegistration.js";
import { Pair } from "../models/Pair.js";
import { AppError } from "../lib/errors.js";

export async function getMyTeam(
  userId: string,
  tournamentId: string,
): Promise<Record<string, unknown> | null> {
  const team = await Team.findOne({ userId, tournamentId })
    .populate("playerIds", "firstName lastName gender")
    .lean();
  return team ? (team as unknown as Record<string, unknown>) : null;
}

export async function saveTeam(
  userId: string,
  tournamentId: string,
  input: { playerIds: string[] },
): Promise<Record<string, unknown>> {
  const { playerIds } = input;

  const [tournament, registration] = await Promise.all([
    Tournament.findById(tournamentId).lean(),
    TournamentRegistration.findOne({ userId, tournamentId }).lean(),
  ]);

  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  if (!registration) {
    throw new AppError(
      "FORBIDDEN",
      "You are not registered for this tournament",
    );
  }
  if (playerIds.length !== tournament.rosterSize) {
    throw new AppError(
      "BAD_REQUEST",
      `Roster must contain exactly ${tournament.rosterSize} players`,
    );
  }

  const tournamentPairs = await Pair.find({ tournamentId }).lean();
  const eligiblePlayerIds = new Set<string>();
  for (const p of tournamentPairs) {
    eligiblePlayerIds.add(String(p.player1Id));
    eligiblePlayerIds.add(String(p.player2Id));
  }

  const invalid = playerIds.filter((id: string) => !eligiblePlayerIds.has(id));
  if (invalid.length > 0) {
    throw new AppError(
      "BAD_REQUEST",
      "Some players are not registered in this tournament",
      {
        invalidPlayerIds: invalid,
      },
    );
  }

  const team = await Team.findOneAndUpdate(
    { userId, tournamentId },
    { playerIds },
    { upsert: true, new: true },
  );
  if (!team) throw new AppError("NOT_FOUND", "Team not found");
  return team.toObject();
}
