import type { MatchPhase, MatchResult } from "../models/enums.js";

export interface ScoringTable {
  QUALIFICATION: number;
  POOL: number;
  MAIN_R12: number;
  MAIN_QF: number;
  MAIN_SF: number;
  MAIN_FINAL: number;
  MAIN_3RD: number;
  bonusWin2_0: number;
  bonusWin2_1: number;
}

export interface MatchInput {
  phase: MatchPhase;
  result: MatchResult;
  winnerPlayerIds: string[];
  loserPlayerIds: string[];
  scoringTable: ScoringTable;
}

export interface PlayerScoreOutput {
  playerId: string;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  isWin: boolean;
}

export function computeMatchPoints(input: MatchInput): PlayerScoreOutput[] {
  const { phase, result, winnerPlayerIds, loserPlayerIds, scoringTable } =
    input;

  const basePoints = scoringTable[phase as keyof ScoringTable] as number;
  if (typeof basePoints !== "number") {
    return [];
  }

  // Result is from winning pair's perspective: WIN_2_0 / WIN_2_1 = they won 2-0 / 2-1; LOSS_0_2 / LOSS_1_2 = home lost, so winner won 2-0 / 2-1
  const bonusWinners =
    result === "WIN_2_0" || result === "LOSS_0_2"
      ? scoringTable.bonusWin2_0
      : scoringTable.bonusWin2_1;

  const winnerBonus = bonusWinners;
  const loserBonus = 0;

  const outputs: PlayerScoreOutput[] = [];

  for (const playerId of winnerPlayerIds) {
    outputs.push({
      playerId,
      basePoints,
      bonusPoints: winnerBonus,
      totalPoints: basePoints + winnerBonus,
      isWin: true,
    });
  }
  for (const playerId of loserPlayerIds) {
    outputs.push({
      playerId,
      basePoints,
      bonusPoints: loserBonus,
      totalPoints: basePoints + loserBonus,
      isWin: false,
    });
  }

  return outputs;
}
