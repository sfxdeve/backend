import { MatchRound } from "../models/enums.js";

// ── Scoring Engine ────────────────────────────────────────────
// Pure computation module — zero side effects, no DB access.
// All functions are deterministic: same input always produces same output.

export interface MatchScoreInput {
  round: MatchRound;
  set1A: number;
  set1B: number;
  set2A: number;
  set2B: number;
  set3A?: number;
  set3B?: number;
  winnerPairId: string; // "A" | "B"
  isRetirement: boolean;
}

export interface PairScore {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
}

export interface MatchPointsResult {
  pairA: PairScore;
  pairB: PairScore;
}

/**
 * Compute base points for a pair from sets 1 and 2.
 * Set 3 (tiebreak) never contributes base points.
 */
function computeBase(set1: number, set2: number): number {
  return Math.floor(set1 / 3) + Math.floor(set2 / 3);
}

/**
 * Compute the win bonus for a given round.
 * All round wins earn +3. Certain rounds add an incremental bonus:
 *   QF  → +3 +1 = +4
 *   SF  → +3 +2 = +5
 *   FINAL (1st place) → +3 +5 = +8
 *   THIRD_PLACE (bronze) → +3 +2 = +5
 */
function winBonus(round: MatchRound): number {
  const base = 3;
  switch (round) {
    case MatchRound.QF:
      return base + 1;
    case MatchRound.SF:
      return base + 2;
    case MatchRound.FINAL:
      return base + 5;
    case MatchRound.THIRD_PLACE:
      return base + 2;
    default:
      return base;
  }
}

/**
 * Compute fantasy points for both pairs in a completed match.
 *
 * @param input  Match score data with winner designation
 * @returns      Points for pair A and pair B
 */
export function computeMatchPoints(input: MatchScoreInput): MatchPointsResult {
  const baseA = computeBase(input.set1A, input.set2A);
  const baseB = computeBase(input.set1B, input.set2B);

  const isWinnerA = input.winnerPairId === "A";
  const bonus = winBonus(input.round);

  const retirementPenalty = input.isRetirement ? -2 : 0;

  const pairA: PairScore = {
    basePoints: baseA,
    bonusPoints: isWinnerA ? bonus : retirementPenalty,
    totalPoints: baseA + (isWinnerA ? bonus : retirementPenalty),
  };

  const pairB: PairScore = {
    basePoints: baseB,
    bonusPoints: isWinnerA ? retirementPenalty : bonus,
    totalPoints: baseB + (isWinnerA ? retirementPenalty : bonus),
  };

  return { pairA, pairB };
}
