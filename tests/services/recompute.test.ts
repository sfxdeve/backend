import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  computeFantasyTeamPoints,
  type LineupDoc,
} from "../../src/services/recompute.service.js";

// ---------------------------------------------------------------------------
// Helpers: simulate the anti-retroactive filtering logic from
// recomputeLineupsForTournament() without touching the DB (§21).
// ---------------------------------------------------------------------------

interface FakeScore {
  playerId: string;
  totalPoints: number;
  playedAt: Date | null;
}

function filterEligibleScores(
  scores: FakeScore[],
  registeredAt: Date,
): FakeScore[] {
  return scores.filter((s) => {
    if (!s.playedAt) return false;
    return s.playedAt >= registeredAt;
  });
}

function buildPointsMap(scores: FakeScore[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of scores) {
    map.set(s.playerId, (map.get(s.playerId) ?? 0) + s.totalPoints);
  }
  return map;
}

describe("recompute service", () => {
  describe("computeFantasyTeamPoints", () => {
    it("sums points for starters that have points", () => {
      const lineup: LineupDoc = {
        _id: {} as never,
        starters: ["s1", "s2", "s3", "s4"].map(
          (id) => ({ toString: () => id }) as never,
        ),
        reserves: ["r1", "r2", "r3"].map(
          (id) => ({ toString: () => id }) as never,
        ),
      };
      const playerIdToPoints = new Map<string, number>([
        ["s1", 10],
        ["s2", 20],
        ["s3", 5],
        ["s4", 15],
      ]);
      expect(computeFantasyTeamPoints(lineup, playerIdToPoints)).toBe(50);
    });

    it("auto-substitutes reserve when starter has no points", () => {
      const lineup: LineupDoc = {
        _id: {} as never,
        starters: ["s1", "s2", "s3", "s4"].map(
          (id) => ({ toString: () => id }) as never,
        ),
        reserves: ["r1", "r2", "r3"].map(
          (id) => ({ toString: () => id }) as never,
        ),
      };
      const playerIdToPoints = new Map<string, number>([
        ["s1", 10],
        ["s2", 0],
        ["s3", 5],
        ["s4", 15],
        ["r1", 8],
      ]);
      const total = computeFantasyTeamPoints(lineup, playerIdToPoints);
      expect(total).toBe(10 + 8 + 5 + 15);
    });

    it("uses first available reserve in priority order for auto-sub", () => {
      const lineup: LineupDoc = {
        _id: {} as never,
        starters: ["s1", "s2"].map((id) => ({ toString: () => id }) as never),
        reserves: ["r1", "r2", "r3"].map(
          (id) => ({ toString: () => id }) as never,
        ),
      };
      const playerIdToPoints = new Map<string, number>([
        ["s1", 0],
        ["s2", 0],
        ["r1", 0],
        ["r2", 5],
        ["r3", 10],
      ]);
      const total = computeFantasyTeamPoints(lineup, playerIdToPoints);
      expect(total).toBe(15);
    });

    it("counts 0 for starter with no points when no reserve has points", () => {
      const lineup: LineupDoc = {
        _id: {} as never,
        starters: ["s1", "s2", "s3", "s4"].map(
          (id) => ({ toString: () => id }) as never,
        ),
        reserves: ["r1", "r2", "r3"].map(
          (id) => ({ toString: () => id }) as never,
        ),
      };
      const playerIdToPoints = new Map<string, number>([
        ["s1", 10],
        ["s2", 0],
        ["s3", 0],
        ["s4", 0],
      ]);
      const total = computeFantasyTeamPoints(lineup, playerIdToPoints);
      expect(total).toBe(10);
    });
  });

  // -------------------------------------------------------------------------
  // Anti-retroactive scoring (§21)
  // -------------------------------------------------------------------------

  describe("anti-retroactive scoring filter (§21)", () => {
    const M1_AT = new Date("2024-06-01T10:00:00Z"); // match 1 – played early
    const M2_AT = new Date("2024-06-08T10:00:00Z"); // match 2 – played later

    const scores: FakeScore[] = [
      { playerId: "p1", totalPoints: 10, playedAt: M1_AT },
      { playerId: "p2", totalPoints: 8, playedAt: M1_AT },
      { playerId: "p1", totalPoints: 15, playedAt: M2_AT },
      { playerId: "p2", totalPoints: 12, playedAt: M2_AT },
    ];

    it("user registered before both matches gets full points from both", () => {
      const registeredAt = new Date("2024-05-01T00:00:00Z"); // before M1
      const eligible = filterEligibleScores(scores, registeredAt);
      expect(eligible).toHaveLength(4);
      const map = buildPointsMap(eligible);
      expect(map.get("p1")).toBe(25); // 10 + 15
      expect(map.get("p2")).toBe(20); // 8 + 12
    });

    it("user registered between M1 and M2 gets 0 for M1, full for M2", () => {
      const registeredAt = new Date("2024-06-05T00:00:00Z"); // after M1, before M2
      const eligible = filterEligibleScores(scores, registeredAt);
      // Only M2 scores (playedAt = M2_AT >= registeredAt)
      expect(eligible).toHaveLength(2);
      const map = buildPointsMap(eligible);
      expect(map.get("p1")).toBe(15);
      expect(map.get("p2")).toBe(12);
    });

    it("user registered after both matches gets 0 points", () => {
      const registeredAt = new Date("2024-06-20T00:00:00Z"); // after both
      const eligible = filterEligibleScores(scores, registeredAt);
      expect(eligible).toHaveLength(0);
      const map = buildPointsMap(eligible);
      expect(map.get("p1")).toBeUndefined();
    });

    it("score without playedAt is always excluded", () => {
      const scoresWithNull: FakeScore[] = [
        { playerId: "p3", totalPoints: 50, playedAt: null },
        { playerId: "p3", totalPoints: 5, playedAt: M1_AT },
      ];
      const registeredAt = new Date("2024-01-01T00:00:00Z");
      const eligible = filterEligibleScores(scoresWithNull, registeredAt);
      expect(eligible).toHaveLength(1);
      expect(eligible[0].totalPoints).toBe(5);
    });

    it("registration on exact match playedAt is included (boundary)", () => {
      const registeredAt = M1_AT; // exactly same timestamp
      const eligible = filterEligibleScores(scores, registeredAt);
      // All 4 records pass (M1_AT >= M1_AT, M2_AT >= M1_AT)
      expect(eligible).toHaveLength(4);
    });

    it("anti-retroactive filter feeds correctly into computeFantasyTeamPoints", () => {
      const registeredAt = new Date("2024-06-05T00:00:00Z"); // after M1
      const eligible = filterEligibleScores(scores, registeredAt);
      const map = buildPointsMap(eligible);

      const lineup: LineupDoc = {
        _id: {} as never,
        starters: ["p1", "p2"].map((id) => ({ toString: () => id }) as never),
        reserves: [],
      };
      const total = computeFantasyTeamPoints(lineup, map);
      // p1 gets 15, p2 gets 12 (M1 excluded)
      expect(total).toBe(27);
    });

    it("auto-sub engages when starter's M1 points are retroactively excluded", () => {
      // p1 has no eligible points (registered after M2), but reserve p3 does
      const lateScoredScores: FakeScore[] = [
        { playerId: "p1", totalPoints: 20, playedAt: M1_AT },
        { playerId: "p3", totalPoints: 12, playedAt: M2_AT }, // reserve
      ];
      const registeredAt = new Date("2024-06-05T00:00:00Z"); // after M1, before M2
      const eligible = filterEligibleScores(lateScoredScores, registeredAt);
      const map = buildPointsMap(eligible);
      // p1 is excluded (only M1 score), p3 is included (M2 score)

      const lineup: LineupDoc = {
        _id: {} as never,
        starters: ["p1"].map((id) => ({ toString: () => id }) as never),
        reserves: ["p3"].map((id) => ({ toString: () => id }) as never),
      };
      const total = computeFantasyTeamPoints(lineup, map);
      // p1 has 0 eligible → sub in p3 (12 points)
      expect(total).toBe(12);
    });
  });
});
