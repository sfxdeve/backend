import { describe, it, expect } from "vitest";
import { computeFantasyTeamPoints } from "../../src/services/recompute.service.js";
import type { LineupDoc } from "../../src/services/recompute.service.js";

describe("lineup logic", () => {
  it("auto-sub priority: first reserve with points is used", () => {
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
      ["s1", 0],
      ["s2", 0],
      ["s3", 0],
      ["s4", 0],
      ["r1", 1],
      ["r2", 2],
      ["r3", 3],
    ]);
    const total = computeFantasyTeamPoints(lineup, playerIdToPoints);
    expect(total).toBe(1 + 2 + 3);
  });

  it("starters and reserves disjoint: only 4 effective slots", () => {
    const lineup: LineupDoc = {
      _id: {} as never,
      starters: ["a", "b", "c", "d"].map(
        (id) => ({ toString: () => id }) as never,
      ),
      reserves: ["e", "f", "g"].map((id) => ({ toString: () => id }) as never),
    };
    const playerIdToPoints = new Map<string, number>([
      ["a", 1],
      ["b", 2],
      ["c", 3],
      ["d", 4],
    ]);
    expect(computeFantasyTeamPoints(lineup, playerIdToPoints)).toBe(10);
  });
});
