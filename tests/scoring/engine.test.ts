import { describe, it, expect } from "vitest";
import {
  computeMatchPoints,
  type ScoringTable,
  type MatchInput,
} from "../../src/scoring/engine.js";
import { MatchPhase, MatchResult } from "../../src/models/enums.js";

const defaultTable: ScoringTable = {
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

function makeInput(
  phase: MatchPhase,
  result: MatchResult,
  winnerIds: string[],
  loserIds: string[],
  table: ScoringTable = defaultTable,
): MatchInput {
  return {
    phase,
    result,
    winnerPlayerIds: winnerIds,
    loserPlayerIds: loserIds,
    scoringTable: table,
  };
}

describe("computeMatchPoints", () => {
  it("returns 4 outputs (2 winners + 2 losers)", () => {
    const out = computeMatchPoints(
      makeInput(
        MatchPhase.POOL,
        MatchResult.WIN_2_0,
        ["w1", "w2"],
        ["l1", "l2"],
      ),
    );
    expect(out).toHaveLength(4);
    expect(out.filter((o) => o.isWin)).toHaveLength(2);
    expect(out.filter((o) => !o.isWin)).toHaveLength(2);
  });

  it("assigns correct base points from phase for QUALIFICATION", () => {
    const out = computeMatchPoints(
      makeInput(
        MatchPhase.QUALIFICATION,
        MatchResult.WIN_2_0,
        ["w1", "w2"],
        ["l1", "l2"],
      ),
    );
    expect(out.every((o) => o.basePoints === 1)).toBe(true);
  });

  it("assigns correct base points for POOL", () => {
    const out = computeMatchPoints(
      makeInput(
        MatchPhase.POOL,
        MatchResult.WIN_2_1,
        ["w1", "w2"],
        ["l1", "l2"],
      ),
    );
    expect(out.every((o) => o.basePoints === 2)).toBe(true);
  });

  it("assigns correct base points for MAIN_R12, MAIN_QF, MAIN_SF, MAIN_FINAL, MAIN_3RD", () => {
    const phases: Array<[MatchPhase, number]> = [
      [MatchPhase.MAIN_R12, 3],
      [MatchPhase.MAIN_QF, 5],
      [MatchPhase.MAIN_SF, 8],
      [MatchPhase.MAIN_3RD, 10],
      [MatchPhase.MAIN_FINAL, 13],
    ];
    for (const [phase, expectedBase] of phases) {
      const out = computeMatchPoints(
        makeInput(phase, MatchResult.WIN_2_0, ["w1", "w2"], ["l1", "l2"]),
      );
      expect(out.every((o) => o.basePoints === expectedBase)).toBe(true);
    }
  });

  it("gives winners bonusWin2_0 when result is WIN_2_0", () => {
    const out = computeMatchPoints(
      makeInput(
        MatchPhase.POOL,
        MatchResult.WIN_2_0,
        ["w1", "w2"],
        ["l1", "l2"],
      ),
    );
    const winners = out.filter((o) => o.isWin);
    expect(winners.every((o) => o.bonusPoints === 2)).toBe(true);
    expect(winners.every((o) => o.totalPoints === 2 + 2)).toBe(true);
  });

  it("gives winners bonusWin2_1 when result is WIN_2_1", () => {
    const out = computeMatchPoints(
      makeInput(
        MatchPhase.POOL,
        MatchResult.WIN_2_1,
        ["w1", "w2"],
        ["l1", "l2"],
      ),
    );
    const winners = out.filter((o) => o.isWin);
    expect(winners.every((o) => o.bonusPoints === 1)).toBe(true);
    expect(winners.every((o) => o.totalPoints === 2 + 1)).toBe(true);
  });

  it("gives winners bonusWin2_0 when result is LOSS_0_2 (winner won 2-0)", () => {
    const out = computeMatchPoints(
      makeInput(
        MatchPhase.MAIN_QF,
        MatchResult.LOSS_0_2,
        ["w1", "w2"],
        ["l1", "l2"],
      ),
    );
    const winners = out.filter((o) => o.isWin);
    expect(
      winners.every((o) => o.bonusPoints === defaultTable.bonusWin2_0),
    ).toBe(true);
  });

  it("gives winners bonusWin2_1 when result is LOSS_1_2", () => {
    const out = computeMatchPoints(
      makeInput(
        MatchPhase.MAIN_SF,
        MatchResult.LOSS_1_2,
        ["w1", "w2"],
        ["l1", "l2"],
      ),
    );
    const winners = out.filter((o) => o.isWin);
    expect(
      winners.every((o) => o.bonusPoints === defaultTable.bonusWin2_1),
    ).toBe(true);
  });

  it("gives losers 0 bonus points", () => {
    const out = computeMatchPoints(
      makeInput(
        MatchPhase.POOL,
        MatchResult.WIN_2_0,
        ["w1", "w2"],
        ["l1", "l2"],
      ),
    );
    const losers = out.filter((o) => !o.isWin);
    expect(losers.every((o) => o.bonusPoints === 0)).toBe(true);
    expect(losers.every((o) => o.totalPoints === o.basePoints)).toBe(true);
  });

  it("is pure: same input yields same output", () => {
    const input = makeInput(
      MatchPhase.MAIN_FINAL,
      MatchResult.WIN_2_1,
      ["a", "b"],
      ["c", "d"],
    );
    const out1 = computeMatchPoints(input);
    const out2 = computeMatchPoints(input);
    expect(out1).toEqual(out2);
  });

  it("returns outputs with correct playerIds", () => {
    const out = computeMatchPoints(
      makeInput(
        MatchPhase.POOL,
        MatchResult.WIN_2_0,
        ["winner1", "winner2"],
        ["loser1", "loser2"],
      ),
    );
    const ids = out.map((o) => o.playerId);
    expect(ids).toContain("winner1");
    expect(ids).toContain("winner2");
    expect(ids).toContain("loser1");
    expect(ids).toContain("loser2");
  });

  it("uses custom scoring table when provided", () => {
    const customTable: ScoringTable = {
      ...defaultTable,
      MAIN_FINAL: 20,
      bonusWin2_0: 5,
    };
    const out = computeMatchPoints(
      makeInput(
        MatchPhase.MAIN_FINAL,
        MatchResult.WIN_2_0,
        ["w1", "w2"],
        ["l1", "l2"],
        customTable,
      ),
    );
    expect(out.every((o) => o.basePoints === 20)).toBe(true);
    const winners = out.filter((o) => o.isWin);
    expect(
      winners.every((o) => o.bonusPoints === 5 && o.totalPoints === 25),
    ).toBe(true);
  });

  it("returns empty array when phase is not in scoring table", () => {
    const table = { ...defaultTable } as ScoringTable & { UNKNOWN: number };
    const out = computeMatchPoints(
      makeInput(
        "UNKNOWN" as MatchPhase,
        MatchResult.WIN_2_0,
        ["w1", "w2"],
        ["l1", "l2"],
        table,
      ),
    );
    expect(out).toEqual([]);
  });
});
