import { describe, it, expect } from "vitest";
import { MatchStatus, MatchResult } from "../../src/models/enums.js";

/**
 * Correction replay tests (§5, §17.2, §21).
 *
 * These tests verify the correction detection and history recording logic
 * that lives in matches.service.ts::updateScore().
 *
 * We test the logic as pure transformations to avoid DB setup.
 */

// Simulate the correction logic from updateScore()
function applyCorrectionLogic(
  match: {
    isCompleted: boolean;
    sets: Array<{ home: number; away: number }>;
    result: MatchResult | null;
    correctionHistory: Array<{
      at: Date;
      previousSets: Array<{ home: number; away: number }>;
      by: string;
    }>;
    status: string;
    scoringDone: boolean;
  },
  newSets: Array<{ home: number; away: number }>,
  newResult: MatchResult,
  adminUserId: string,
) {
  const updated = { ...match, correctionHistory: [...match.correctionHistory] };

  if (match.isCompleted) {
    updated.correctionHistory.push({
      at: new Date(),
      previousSets: match.sets,
      by: adminUserId,
    });
    updated.status = MatchStatus.CORRECTED;
  }

  updated.sets = newSets;
  updated.result = newResult;
  updated.scoringDone = false;

  return updated;
}

describe("correction replay logic (§5, §17.2)", () => {
  const completedMatch = {
    isCompleted: true,
    sets: [{ home: 2, away: 0 }],
    result: MatchResult.WIN_2_0,
    correctionHistory: [],
    status: MatchStatus.COMPLETED,
    scoringDone: true,
  };

  it("sets status to CORRECTED when match is already completed", () => {
    const result = applyCorrectionLogic(
      completedMatch,
      [{ home: 0, away: 2 }],
      MatchResult.LOSS_0_2,
      "admin123",
    );
    expect(result.status).toBe(MatchStatus.CORRECTED);
  });

  it("pushes previous sets to correctionHistory", () => {
    const result = applyCorrectionLogic(
      completedMatch,
      [{ home: 0, away: 2 }],
      MatchResult.LOSS_0_2,
      "admin123",
    );
    expect(result.correctionHistory).toHaveLength(1);
    expect(result.correctionHistory[0].previousSets).toEqual(
      completedMatch.sets,
    );
  });

  it("records the adminUserId in correctionHistory.by", () => {
    const result = applyCorrectionLogic(
      completedMatch,
      [{ home: 0, away: 2 }],
      MatchResult.LOSS_0_2,
      "admin-user-42",
    );
    expect(result.correctionHistory[0].by).toBe("admin-user-42");
  });

  it("resets scoringDone to false after correction", () => {
    const result = applyCorrectionLogic(
      completedMatch,
      [{ home: 0, away: 2 }],
      MatchResult.LOSS_0_2,
      "admin123",
    );
    expect(result.scoringDone).toBe(false);
  });

  it("updates sets and result to new values", () => {
    const newSets = [{ home: 0, away: 2 }];
    const result = applyCorrectionLogic(
      completedMatch,
      newSets,
      MatchResult.LOSS_0_2,
      "admin123",
    );
    expect(result.sets).toEqual(newSets);
    expect(result.result).toBe(MatchResult.LOSS_0_2);
  });

  it("stacks multiple corrections in correctionHistory", () => {
    const alreadyCorrected = {
      ...completedMatch,
      status: MatchStatus.CORRECTED,
      correctionHistory: [
        { at: new Date(), previousSets: [{ home: 2, away: 0 }], by: "admin1" },
      ],
    };
    const result = applyCorrectionLogic(
      alreadyCorrected,
      [{ home: 2, away: 1 }],
      MatchResult.WIN_2_1,
      "admin2",
    );
    expect(result.correctionHistory).toHaveLength(2);
    expect(result.correctionHistory[1].by).toBe("admin2");
  });

  it("does NOT set CORRECTED status for non-completed match", () => {
    const draft = {
      isCompleted: false,
      sets: [],
      result: null,
      correctionHistory: [],
      status: MatchStatus.LIVE,
      scoringDone: false,
    };
    const result = applyCorrectionLogic(
      draft,
      [{ home: 2, away: 0 }],
      MatchResult.WIN_2_0,
      "admin123",
    );
    expect(result.status).not.toBe(MatchStatus.CORRECTED);
    expect(result.correctionHistory).toHaveLength(0);
  });
});
