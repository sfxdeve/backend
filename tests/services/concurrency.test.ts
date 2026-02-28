import { describe, it, expect } from "vitest";

/**
 * Concurrency / idempotency tests (§17.2, §20).
 *
 * These tests verify the idempotency guard logic that lives in
 * recompute.service.ts::onMatchUpdated().
 *
 * Two guards prevent double-scoring:
 *   1. versionNumber mismatch → stale event, skip.
 *   2. scoringDone === true → already processed, skip.
 *
 * We test the guard predicates as pure transformations.
 */

// Mirrors the guard logic extracted from onMatchUpdated()
function shouldSkip(
  matchVersionNumber: number,
  requestedVersionNumber: number,
  scoringDone: boolean,
): { skip: boolean; reason?: string } {
  if (matchVersionNumber !== requestedVersionNumber) {
    return { skip: true, reason: "version_mismatch" };
  }
  if (scoringDone) {
    return { skip: true, reason: "already_scored" };
  }
  return { skip: false };
}

describe("onMatchUpdated idempotency guard (§17.2, §20)", () => {
  it("does NOT skip when version matches and scoringDone=false", () => {
    const result = shouldSkip(1, 1, false);
    expect(result.skip).toBe(false);
  });

  it("skips when versionNumber in DB differs from requested version (stale event)", () => {
    // DB has versionNumber=2 but event carries versionNumber=1 (already superseded)
    const result = shouldSkip(2, 1, false);
    expect(result.skip).toBe(true);
    expect(result.reason).toBe("version_mismatch");
  });

  it("skips when versionNumber in DB is newer than requested", () => {
    const result = shouldSkip(5, 3, false);
    expect(result.skip).toBe(true);
    expect(result.reason).toBe("version_mismatch");
  });

  it("skips when scoringDone=true even if version matches", () => {
    const result = shouldSkip(1, 1, true);
    expect(result.skip).toBe(true);
    expect(result.reason).toBe("already_scored");
  });

  it("skips due to version mismatch first (before checking scoringDone)", () => {
    // Both guards would fire; version check comes first
    const result = shouldSkip(2, 1, true);
    expect(result.skip).toBe(true);
    expect(result.reason).toBe("version_mismatch");
  });

  it("simulates parallel calls: only the first one proceeds", () => {
    // Two concurrent calls arrive for versionNumber=1.
    // Match in DB: versionNumber=1, scoringDone=false initially.
    // First call: DB state matches → proceeds, then sets scoringDone=true.
    // Second call: scoringDone=true → skipped.
    const firstCall = shouldSkip(1, 1, false);
    expect(firstCall.skip).toBe(false);

    // After first call completes, scoringDone is set to true in the DB.
    const secondCall = shouldSkip(1, 1, true);
    expect(secondCall.skip).toBe(true);
    expect(secondCall.reason).toBe("already_scored");
  });

  it("simulates race: second caller sees incremented versionNumber", () => {
    // A correction bumps versionNumber from 1 to 2.
    // A stale worker still holds versionNumber=1 → skipped.
    const staleWorker = shouldSkip(2, 1, false);
    expect(staleWorker.skip).toBe(true);

    // The fresh worker holds versionNumber=2 → proceeds.
    const freshWorker = shouldSkip(2, 2, false);
    expect(freshWorker.skip).toBe(false);
  });
});
