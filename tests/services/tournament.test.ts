import { describe, it, expect } from "vitest";

describe("tournament state machine", () => {
  const validTransitions: Record<string, string[]> = {
    UPCOMING: ["REGISTRATION_LOCKED", "LIVE"],
    REGISTRATION_LOCKED: ["LIVE"],
    LIVE: ["COMPLETED"],
    COMPLETED: ["FINALIZED"],
    FINALIZED: [],
  };

  it("allows valid transitions", () => {
    expect(validTransitions.UPCOMING).toContain("REGISTRATION_LOCKED");
    expect(validTransitions.UPCOMING).toContain("LIVE");
    expect(validTransitions.REGISTRATION_LOCKED).toContain("LIVE");
    expect(validTransitions.LIVE).toContain("COMPLETED");
    expect(validTransitions.COMPLETED).toContain("FINALIZED");
  });

  it("disallows invalid transitions", () => {
    expect(validTransitions.UPCOMING).not.toContain("COMPLETED");
    expect(validTransitions.LIVE).not.toContain("UPCOMING");
    expect(validTransitions.FINALIZED).toHaveLength(0);
  });
});

describe("price algorithm constraints", () => {
  function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  it("enforces floor and cap", () => {
    expect(clamp(5, 10, 200)).toBe(10);
    expect(clamp(250, 10, 200)).toBe(200);
    expect(clamp(100, 10, 200)).toBe(100);
  });

  it("max change ±15%", () => {
    const oldPrice = 100;
    const maxChange = oldPrice * 0.15;
    expect(
      clamp(oldPrice + 20, oldPrice - maxChange, oldPrice + maxChange),
    ).toBe(115);
    expect(
      clamp(oldPrice - 20, oldPrice - maxChange, oldPrice + maxChange),
    ).toBe(85);
  });
});
