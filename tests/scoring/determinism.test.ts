import { describe, it, expect } from "vitest";
import {
  computeMatchPoints,
  type ScoringTable,
} from "../../src/scoring/engine.js";
import { MatchPhase, MatchResult } from "../../src/models/enums.js";

const table: ScoringTable = {
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

describe("scoring determinism", () => {
  it("full tournament simulation: same input produces identical output", () => {
    const inputs = [
      {
        phase: MatchPhase.QUALIFICATION,
        result: MatchResult.WIN_2_0,
        winnerPlayerIds: ["p1", "p2"],
        loserPlayerIds: ["p3", "p4"],
        scoringTable: table,
      },
      {
        phase: MatchPhase.POOL,
        result: MatchResult.WIN_2_1,
        winnerPlayerIds: ["p1", "p2"],
        loserPlayerIds: ["p5", "p6"],
        scoringTable: table,
      },
      {
        phase: MatchPhase.MAIN_QF,
        result: MatchResult.LOSS_0_2,
        winnerPlayerIds: ["p7", "p8"],
        loserPlayerIds: ["p1", "p2"],
        scoringTable: table,
      },
    ];

    const run1 = inputs.flatMap((i) => computeMatchPoints(i));
    const run2 = inputs.flatMap((i) => computeMatchPoints(i));

    expect(run1).toEqual(run2);
    expect(run1.length).toBe(12);
  });
});
