import { LeagueMember } from "../models/LeagueMember.js";
import { Match } from "../models/Match.js";
import { PlayerScore } from "../models/PlayerScore.js";
import { AppError } from "../lib/errors.js";
import { appEmitter } from "../events/emitter.js";

export async function getPlayerScores(tournamentId: string, playerId?: string) {
  const filter: Record<string, unknown> = { tournamentId };
  if (playerId) filter.playerId = playerId;
  const scores = await PlayerScore.find(filter)
    .sort({ playedAt: 1 })
    .populate("playerId", "firstName lastName")
    .populate("pairId")
    .lean();
  const aggregated = scores.reduce(
    (acc, s) => {
      const id = (s.playerId as { _id: unknown })._id?.toString() ?? "";
      if (!acc[id]) acc[id] = { playerId: id, totalPoints: 0, matches: [] };
      acc[id].totalPoints += s.totalPoints;
      acc[id].matches.push(s);
      return acc;
    },
    {} as Record<
      string,
      { playerId: string; totalPoints: number; matches: unknown[] }
    >,
  );
  return Object.values(aggregated);
}

export async function getLeagueStandings(leagueId: string) {
  const members = await LeagueMember.find({ leagueId })
    .sort({ totalPoints: -1 })
    .populate("userId", "name email")
    .lean();
  return members;
}

export async function triggerRecompute(tournamentId: string): Promise<void> {
  const matches = await Match.find({
    tournamentId,
    isCompleted: true,
  })
    .sort({ playedAt: 1 })
    .select("_id versionNumber")
    .lean();
  for (const m of matches) {
    appEmitter.emit("match:updated", {
      matchId: m._id.toString(),
      tournamentId,
      versionNumber: m.versionNumber ?? 0,
    });
  }
}
