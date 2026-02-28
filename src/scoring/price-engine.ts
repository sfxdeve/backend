/**
 * Pure price evolution computation (§12).
 * Extracted as a pure function for testability and reuse.
 */

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export interface PriceInput {
  oldPrice: number;
  tournamentPoints: number;
  movingAveragePoints: number;
  volatility: number;
  floor: number;
  cap: number;
}

export interface PriceOutput {
  newPrice: number;
  newMovingAverage: number;
}

/**
 * Compute new player price after a tournament.
 * Formula: new_price = round(old_price + volatility * (tournament_points - moving_avg))
 * Constraints: ±15% max change per tournament, floor, cap, rounded to integer.
 * Moving average updated with simple exponential smoothing (n=1 lookback).
 */
export function computeNewPrice(input: PriceInput): PriceOutput {
  const {
    oldPrice,
    tournamentPoints,
    movingAveragePoints,
    volatility,
    floor,
    cap,
  } = input;
  const delta = volatility * (tournamentPoints - movingAveragePoints);
  let newPrice = Math.round(oldPrice + delta);
  const maxChange = oldPrice * 0.15;
  newPrice = clamp(newPrice, oldPrice - maxChange, oldPrice + maxChange);
  newPrice = clamp(newPrice, floor, cap);

  // Exponential moving average (n=1 lookback window)
  const newMovingAverage = movingAveragePoints * 0.5 + tournamentPoints * 0.5;

  return { newPrice, newMovingAverage };
}
