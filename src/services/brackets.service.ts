import { Match } from "../models/Match.js";
import { Tournament } from "../models/Tournament.js";
import { AppError } from "../lib/errors.js";
import { MatchPhase } from "../models/enums.js";
import { computeMatchId } from "./matches.service.js";

export async function getForTournament(tournamentId: string) {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  const matches = await Match.find({ tournamentId })
    .sort({ phase: 1, bracketSlot: 1, scheduledAt: 1 })
    .populate("homePairId")
    .populate("awayPairId")
    .populate("winnerId")
    .lean();
  const byPhase = matches.reduce(
    (acc, m) => {
      const p = m.phase as string;
      if (!acc[p]) acc[p] = [];
      acc[p].push(m);
      return acc;
    },
    {} as Record<string, typeof matches>,
  );
  return {
    tournamentId,
    phases: Object.values(MatchPhase),
    byPhase,
    matches,
  };
}

export async function generateBracket(tournamentId: string): Promise<void> {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  // Create placeholder matches for MAIN_R12, MAIN_QF, MAIN_SF, MAIN_FINAL, MAIN_3RD
  // Slot numbering and dependency tree would be defined by bracket structure.
  // Minimal implementation: create one placeholder per phase with bracketSlot.
  const phases: MatchPhase[] = [
    MatchPhase.MAIN_R12,
    MatchPhase.MAIN_QF,
    MatchPhase.MAIN_SF,
    MatchPhase.MAIN_FINAL,
    MatchPhase.MAIN_3RD,
  ];
  for (let slot = 1; slot <= 16; slot++) {
    const phase =
      phases[Math.min(Math.floor((slot - 1) / 4), phases.length - 1)];
    const scheduledAt = new Date(tournament.startDate);
    const mid = computeMatchId(tournamentId, phase, slot, scheduledAt);
    const exists = await Match.findOne({ matchId: mid }).lean();
    if (!exists) {
      await Match.create({
        tournamentId,
        phase,
        status: "SCHEDULED",
        matchId: mid,
        bracketSlot: slot,
        scheduledAt,
      });
    }
  }
}

export async function resolveSlot(matchId: string): Promise<void> {
  const match = await Match.findById(matchId).lean();
  if (!match || !match.winnerId || !match.loserId)
    throw new AppError(
      "BAD_REQUEST",
      "Match not completed or missing winner/loser",
    );
  // Update next bracket slot(s) with winner/loser - structure depends on bracket layout
  // Stub: no-op; full implementation would update homePairId/awayPairId of successor matches
}
