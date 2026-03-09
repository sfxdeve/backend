// Top-20 fixed price lookup (rank → Fantacoin price)
const TOP20: Record<number, number> = {
  1: 100,
  2: 98,
  3: 95,
  4: 93,
  5: 91,
  6: 90,
  7: 90,
  8: 89,
  9: 88,
  10: 88,
  11: 87,
  12: 86,
  13: 85,
  14: 84,
  15: 84,
  16: 83,
  17: 82,
  18: 81,
  19: 80,
  20: 78,
};

export function computeAthletePrice(rank: number): number {
  if (rank >= 85) return 1;
  if (rank <= 20) return TOP20[rank]!;
  if (rank <= 50) return 77 - Math.floor((rank - 21) / 2);
  if (rank <= 70) return 62 - 2 * (rank - 51);
  if (rank <= 80) return 22 - 2 * (rank - 71);
  if (rank === 81) return 3;
  if (rank <= 83) return 2;
  return 1; // rank 84
}
