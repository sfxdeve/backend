import { describe, it, expect } from "vitest";
import { computeNewPrice } from "../../src/scoring/price-engine.js";

const BASE = {
  volatility: 1,
  floor: 10,
  cap: 200,
};

describe("computeNewPrice (§12 price evolution)", () => {
  it("increases price when tournamentPoints > movingAverage", () => {
    const { newPrice } = computeNewPrice({
      ...BASE,
      oldPrice: 100,
      tournamentPoints: 50,
      movingAveragePoints: 20,
    });
    expect(newPrice).toBeGreaterThan(100);
  });

  it("decreases price when tournamentPoints < movingAverage", () => {
    const { newPrice } = computeNewPrice({
      ...BASE,
      oldPrice: 100,
      tournamentPoints: 10,
      movingAveragePoints: 40,
    });
    expect(newPrice).toBeLessThan(100);
  });

  it("clamps price increase to +15% max change", () => {
    const oldPrice = 100;
    const { newPrice } = computeNewPrice({
      ...BASE,
      oldPrice,
      tournamentPoints: 1000, // huge — would push price way up
      movingAveragePoints: 0,
      volatility: 10,
    });
    expect(newPrice).toBeLessThanOrEqual(Math.round(oldPrice * 1.15));
  });

  it("clamps price decrease to -15% max change", () => {
    const oldPrice = 100;
    const { newPrice } = computeNewPrice({
      ...BASE,
      oldPrice,
      tournamentPoints: 0,
      movingAveragePoints: 1000, // huge — would push price way down
      volatility: 10,
    });
    expect(newPrice).toBeGreaterThanOrEqual(Math.round(oldPrice * 0.85));
  });

  it("never goes below floor", () => {
    const { newPrice } = computeNewPrice({
      ...BASE,
      oldPrice: 11,
      tournamentPoints: 0,
      movingAveragePoints: 5,
      volatility: 10,
      floor: 10,
    });
    expect(newPrice).toBeGreaterThanOrEqual(10);
  });

  it("never exceeds cap", () => {
    const { newPrice } = computeNewPrice({
      ...BASE,
      oldPrice: 195,
      tournamentPoints: 1000,
      movingAveragePoints: 0,
      volatility: 10,
      cap: 200,
    });
    expect(newPrice).toBeLessThanOrEqual(200);
  });

  it("rounds to nearest integer", () => {
    const { newPrice } = computeNewPrice({
      ...BASE,
      oldPrice: 100,
      tournamentPoints: 30,
      movingAveragePoints: 20,
      volatility: 1.5, // delta = 1.5 * 10 = 15 → new = 115
    });
    expect(Number.isInteger(newPrice)).toBe(true);
  });

  it("no change when tournamentPoints equals movingAverage", () => {
    const { newPrice } = computeNewPrice({
      ...BASE,
      oldPrice: 100,
      tournamentPoints: 30,
      movingAveragePoints: 30,
    });
    expect(newPrice).toBe(100);
  });

  it("updates moving average via exponential smoothing", () => {
    const { newMovingAverage } = computeNewPrice({
      ...BASE,
      oldPrice: 100,
      tournamentPoints: 40,
      movingAveragePoints: 20,
    });
    // new = 20 * 0.5 + 40 * 0.5 = 30
    expect(newMovingAverage).toBe(30);
  });

  it("respects custom volatility factor", () => {
    const delta1 = computeNewPrice({
      ...BASE,
      oldPrice: 100,
      tournamentPoints: 30,
      movingAveragePoints: 20,
      volatility: 1,
    });
    const delta2 = computeNewPrice({
      ...BASE,
      oldPrice: 100,
      tournamentPoints: 30,
      movingAveragePoints: 20,
      volatility: 2,
    });
    // With volatility 2, delta is larger (but still capped at 15%)
    expect(delta2.newPrice).toBeGreaterThanOrEqual(delta1.newPrice);
  });

  it("is deterministic — same input produces same output", () => {
    const input = {
      ...BASE,
      oldPrice: 120,
      tournamentPoints: 35,
      movingAveragePoints: 25,
    };
    expect(computeNewPrice(input)).toEqual(computeNewPrice(input));
  });
});
