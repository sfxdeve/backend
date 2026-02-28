import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  computeFantasyTeamPoints,
  type LineupDoc,
} from "../../src/services/recompute.service.js";

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
});
