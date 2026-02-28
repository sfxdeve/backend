import { describe, it, expect } from "vitest";
import { MatchPhase, MatchResult } from "../../src/models/enums.js";
import {
  computeMatchPoints,
  type ScoringTable,
} from "../../src/scoring/engine.js";
import {
  computeFantasyTeamPoints,
  type LineupDoc,
} from "../../src/services/recompute.service.js";
import {
  computeNewPrice,
  type PriceInput,
} from "../../src/scoring/price-engine.js";

/**
 * Full tournament simulation (§5, §10, §11, §12).
 *
 * Tests the complete fantasy scoring pipeline as pure computation:
 *   Pool phase → Main draw (R12 → QF → SF → FINAL) → Finalize (price update).
 *
 * No DB, no I/O. Verifies:
 *   - Points accumulate correctly across phases.
 *   - Winner bonuses applied correctly (2-0 vs 2-1).
 *   - Fantasy team totals (with auto-sub) match expected.
 *   - Price evolution respects ±15% cap, floor, cap.
 */

// Default scoring table matching schema defaults
const SCORING_TABLE: ScoringTable = {
  QUALIFICATION: 2,
  POOL: 3,
  MAIN_R12: 5,
  MAIN_QF: 7,
  MAIN_SF: 10,
  MAIN_FINAL: 15,
  MAIN_3RD: 10,
  bonusWin2_0: 3,
  bonusWin2_1: 1,
};

// ---------------------------------------------------------------------------
// Fixtures: 8 players forming 4 pairs
// ---------------------------------------------------------------------------
const PAIRS = {
  A: { id: "pairA", player1: "pA1", player2: "pA2" },
  B: { id: "pairB", player1: "pB1", player2: "pB2" },
  C: { id: "pairC", player1: "pC1", player2: "pC2" },
  D: { id: "pairD", player1: "pD1", player2: "pD2" },
};

function players(pair: (typeof PAIRS)[keyof typeof PAIRS]) {
  return [pair.player1, pair.player2];
}

// Helper: accumulate a single match result into a points ledger
function applyMatch(
  ledger: Map<string, number>,
  phase: MatchPhase,
  result: MatchResult,
  winner: (typeof PAIRS)[keyof typeof PAIRS],
  loser: (typeof PAIRS)[keyof typeof PAIRS],
) {
  const outputs = computeMatchPoints({
    phase,
    result,
    winnerPlayerIds: players(winner),
    loserPlayerIds: players(loser),
    scoringTable: SCORING_TABLE,
  });
  for (const o of outputs) {
    ledger.set(o.playerId, (ledger.get(o.playerId) ?? 0) + o.totalPoints);
  }
}

// Helper: build a minimal LineupDoc
function makeLineup(
  id: string,
  starterIds: string[],
  reserveIds: string[],
): LineupDoc {
  return {
    _id: { toString: () => id } as never,
    userId: { toString: () => `user-${id}` } as never,
    starters: starterIds.map((s) => ({ toString: () => s }) as never),
    reserves: reserveIds.map((r) => ({ toString: () => r }) as never),
  };
}

describe("full tournament simulation (§5, §10, §11, §12)", () => {
  /**
   * Tournament bracket:
   *   Pool: A beats B (2-0), C beats D (2-1)
   *   R12: A beats C (2-1), B beats D (2-0)  [hypothetical; simplified main draw]
   *   QF: A beats B (2-0)  [paired again in QF]
   *   SF: A advances (bye/auto-seeded for test simplicity, not tested here)
   *   FINAL: A beats D (2-0)
   */

  it("pool phase: winner gets base+bonus, loser gets only base", () => {
    const outputs = computeMatchPoints({
      phase: MatchPhase.POOL,
      result: MatchResult.WIN_2_0,
      winnerPlayerIds: players(PAIRS.A),
      loserPlayerIds: players(PAIRS.B),
      scoringTable: SCORING_TABLE,
    });
    // POOL base = 3, bonus 2-0 = 3
    const winner = outputs.filter((o) => o.isWin);
    const loser = outputs.filter((o) => !o.isWin);
    expect(winner).toHaveLength(2);
    expect(winner[0].basePoints).toBe(3);
    expect(winner[0].bonusPoints).toBe(3);
    expect(winner[0].totalPoints).toBe(6);
    expect(loser[0].basePoints).toBe(3);
    expect(loser[0].bonusPoints).toBe(0);
    expect(loser[0].totalPoints).toBe(3);
  });

  it("WIN_2_1 gives smaller bonus than WIN_2_0", () => {
    const out20 = computeMatchPoints({
      phase: MatchPhase.POOL,
      result: MatchResult.WIN_2_0,
      winnerPlayerIds: players(PAIRS.A),
      loserPlayerIds: players(PAIRS.B),
      scoringTable: SCORING_TABLE,
    });
    const out21 = computeMatchPoints({
      phase: MatchPhase.POOL,
      result: MatchResult.WIN_2_1,
      winnerPlayerIds: players(PAIRS.A),
      loserPlayerIds: players(PAIRS.B),
      scoringTable: SCORING_TABLE,
    });
    const bonus20 = out20.find((o) => o.isWin)!.bonusPoints;
    const bonus21 = out21.find((o) => o.isWin)!.bonusPoints;
    expect(bonus20).toBeGreaterThan(bonus21);
  });

  it("LOSS_0_2 is equivalent to WIN_2_0 from opposing perspective (same bonus)", () => {
    // When result is LOSS_0_2, the winner is still the same pair (they won 2-0).
    const outputs = computeMatchPoints({
      phase: MatchPhase.POOL,
      result: MatchResult.LOSS_0_2,
      winnerPlayerIds: players(PAIRS.A),
      loserPlayerIds: players(PAIRS.B),
      scoringTable: SCORING_TABLE,
    });
    const winnerOutput = outputs.find((o) => o.isWin)!;
    expect(winnerOutput.bonusPoints).toBe(SCORING_TABLE.bonusWin2_0);
  });

  it("points accumulate correctly across pool + main draw phases", () => {
    const ledger = new Map<string, number>();

    // Pool phase
    applyMatch(ledger, MatchPhase.POOL, MatchResult.WIN_2_0, PAIRS.A, PAIRS.B);
    // A: 3+3=6 each player, B: 3 each

    applyMatch(ledger, MatchPhase.POOL, MatchResult.WIN_2_1, PAIRS.C, PAIRS.D);
    // C: 3+1=4 each, D: 3 each

    // Main draw R12
    applyMatch(
      ledger,
      MatchPhase.MAIN_R12,
      MatchResult.WIN_2_1,
      PAIRS.A,
      PAIRS.C,
    );
    // A: +5+1=6 each, C: +5 each

    applyMatch(
      ledger,
      MatchPhase.MAIN_R12,
      MatchResult.WIN_2_0,
      PAIRS.B,
      PAIRS.D,
    );
    // B: +5+3=8 each, D: +5 each

    // Main draw QF
    applyMatch(
      ledger,
      MatchPhase.MAIN_QF,
      MatchResult.WIN_2_0,
      PAIRS.A,
      PAIRS.B,
    );
    // A: +7+3=10 each, B: +7 each

    // A players: pool(6) + r12(6) + qf(10) = 22
    expect(ledger.get("pA1")).toBe(22);
    expect(ledger.get("pA2")).toBe(22);

    // B players: pool(3) + r12(8) + qf(7) = 18
    expect(ledger.get("pB1")).toBe(18);
    expect(ledger.get("pB2")).toBe(18);

    // C players: pool(4) + r12(5) = 9
    expect(ledger.get("pC1")).toBe(9);
    expect(ledger.get("pC2")).toBe(9);

    // D players: pool(3) + r12(5) = 8
    expect(ledger.get("pD1")).toBe(8);
    expect(ledger.get("pD2")).toBe(8);
  });

  it("higher-value phases give more points than lower phases", () => {
    const poolWin = computeMatchPoints({
      phase: MatchPhase.POOL,
      result: MatchResult.WIN_2_0,
      winnerPlayerIds: ["pA1"],
      loserPlayerIds: ["pB1"],
      scoringTable: SCORING_TABLE,
    }).find((o) => o.isWin)!.totalPoints;

    const finalWin = computeMatchPoints({
      phase: MatchPhase.MAIN_FINAL,
      result: MatchResult.WIN_2_0,
      winnerPlayerIds: ["pA1"],
      loserPlayerIds: ["pB1"],
      scoringTable: SCORING_TABLE,
    }).find((o) => o.isWin)!.totalPoints;

    expect(finalWin).toBeGreaterThan(poolWin);
  });

  it("fantasy team points match sum of effective starters (no auto-sub needed)", () => {
    const ledger = new Map<string, number>();
    applyMatch(ledger, MatchPhase.POOL, MatchResult.WIN_2_0, PAIRS.A, PAIRS.B);
    applyMatch(
      ledger,
      MatchPhase.MAIN_R12,
      MatchResult.WIN_2_1,
      PAIRS.A,
      PAIRS.C,
    );

    // Lineup with pA1 + pB1 as starters (one winner, one loser)
    const lineup = makeLineup("L1", ["pA1", "pB1"], []);
    const total = computeFantasyTeamPoints(lineup, ledger);

    // pA1: pool(6) + r12(6) = 12; pB1: pool(3)
    expect(total).toBe(12 + 3);
  });

  it("auto-sub fires when starter is absent from ledger", () => {
    const ledger = new Map<string, number>([
      ["pA1", 20],
      ["pA2", 18],
      // pB1 absent (did not play or had 0 points)
      ["pC1", 10], // reserve
    ]);

    const lineup = makeLineup("L2", ["pA1", "pB1"], ["pC1"]);
    const total = computeFantasyTeamPoints(lineup, ledger);
    // pB1 has no points → sub pC1 (10)
    expect(total).toBe(20 + 10);
  });

  it("price finalization: FINAL winner gets price increase", () => {
    // Simulate pair A winning the tournament with 22 points
    const priceInput: PriceInput = {
      oldPrice: 100,
      tournamentPoints: 22,
      movingAveragePoints: 10, // previous average was 10
      volatility: 1.5,
      floor: 10,
      cap: 500,
    };
    const { newPrice, newMovingAverage } = computeNewPrice(priceInput);

    // delta = 1.5 * (22 - 10) = 18, unclamped = 118
    // but ±15% cap: max change = 100 * 0.15 = 15 → clamped to 115
    expect(newPrice).toBe(115);
    expect(newMovingAverage).toBe(16); // 10*0.5 + 22*0.5
  });

  it("price finalization: poor performer gets price decrease (within 15% cap)", () => {
    const priceInput: PriceInput = {
      oldPrice: 100,
      tournamentPoints: 2,
      movingAveragePoints: 20, // was performing much better
      volatility: 2.0,
      floor: 10,
      cap: 500,
    };
    const { newPrice } = computeNewPrice(priceInput);

    // delta = 2.0 * (2 - 20) = -36, unclamped newPrice = 100 - 36 = 64
    // But 15% cap: min = 100 - 15 = 85
    expect(newPrice).toBe(85);
  });

  it("full pipeline: 4-match tournament → final standings → price update", () => {
    const ledger = new Map<string, number>();

    // Play all matches
    applyMatch(ledger, MatchPhase.POOL, MatchResult.WIN_2_0, PAIRS.A, PAIRS.B);
    applyMatch(ledger, MatchPhase.POOL, MatchResult.WIN_2_1, PAIRS.C, PAIRS.D);
    applyMatch(
      ledger,
      MatchPhase.MAIN_R12,
      MatchResult.WIN_2_0,
      PAIRS.A,
      PAIRS.C,
    );
    applyMatch(
      ledger,
      MatchPhase.MAIN_FINAL,
      MatchResult.WIN_2_0,
      PAIRS.A,
      PAIRS.B,
    );

    // Fantasy team 1: all from pair A (best performers)
    const team1 = makeLineup("T1", ["pA1", "pA2"], []);
    const team1Points = computeFantasyTeamPoints(team1, ledger);

    // Fantasy team 2: mixed - one A, one D (D only played 2 matches)
    const team2 = makeLineup("T2", ["pA1", "pD1"], []);
    const team2Points = computeFantasyTeamPoints(team2, ledger);

    // Team 1 should always beat team 2 (pA2 > pD1)
    expect(team1Points).toBeGreaterThan(team2Points);

    // Price update for pA1 after dominant tournament
    const pA1Points = ledger.get("pA1")!;
    const { newPrice: pA1NewPrice } = computeNewPrice({
      oldPrice: 150,
      tournamentPoints: pA1Points,
      movingAveragePoints: 10,
      volatility: 1.0,
      floor: 10,
      cap: 1000,
    });
    // pA1 performed well above average → price should increase
    expect(pA1NewPrice).toBeGreaterThan(150);
  });
});
