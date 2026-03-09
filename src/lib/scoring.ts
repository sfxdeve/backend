import { prisma } from "../prisma/index.js";

// ─── Point Calculation Helpers ────────────────────────────────────────────────

function computeBasePoints(s1: number, s2: number): number {
  return Math.floor(s1 / 3) + Math.floor(s2 / 3);
}

type BonusPair = { winner: number; loser: number };

function computeBonus(hasTiebreak: boolean): BonusPair {
  return hasTiebreak
    ? { winner: 1.0, loser: 0.5 }
    : { winner: 2.0, loser: 0.0 };
}

// ─── Match-level Scoring ──────────────────────────────────────────────────────

/**
 * Compute and upsert AthleteMatchPoints for all 4 athletes in a completed match.
 * Returns { sideA: totalPoints, sideB: totalPoints }.
 */
async function scoreMatch(
  matchId: string,
): Promise<{ sideA: number; sideB: number }> {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    select: {
      set1A: true,
      set1B: true,
      set2A: true,
      set2B: true,
      set3A: true,
      set3B: true,
      winnerSide: true,
      sideAAthlete1Id: true,
      sideAAthlete2Id: true,
      sideBAthlete1Id: true,
      sideBAthlete2Id: true,
    },
  });

  if (match.winnerSide === null) {
    throw new Error(`Match ${matchId} has no winnerSide set`);
  }

  const hasTiebreak = match.set3A !== null && match.set3B !== null;
  const bonus = computeBonus(hasTiebreak);

  const baseA = computeBasePoints(match.set1A!, match.set2A!);
  const baseB = computeBasePoints(match.set1B!, match.set2B!);

  const bonusA = match.winnerSide === "A" ? bonus.winner : bonus.loser;
  const bonusB = match.winnerSide === "B" ? bonus.winner : bonus.loser;

  const totalA = baseA + bonusA;
  const totalB = baseB + bonusB;

  const athletesA = [match.sideAAthlete1Id, match.sideAAthlete2Id];
  const athletesB = [match.sideBAthlete1Id, match.sideBAthlete2Id];

  await Promise.all([
    ...athletesA.map((athleteId) =>
      prisma.athleteMatchPoints.upsert({
        where: { matchId_athleteId: { matchId, athleteId } },
        create: {
          matchId,
          athleteId,
          side: "A",
          basePoints: baseA,
          bonusPoints: bonusA,
          totalPoints: totalA,
        },
        update: {
          side: "A",
          basePoints: baseA,
          bonusPoints: bonusA,
          totalPoints: totalA,
        },
      }),
    ),
    ...athletesB.map((athleteId) =>
      prisma.athleteMatchPoints.upsert({
        where: { matchId_athleteId: { matchId, athleteId } },
        create: {
          matchId,
          athleteId,
          side: "B",
          basePoints: baseB,
          bonusPoints: bonusB,
          totalPoints: totalB,
        },
        update: {
          side: "B",
          basePoints: baseB,
          bonusPoints: bonusB,
          totalPoints: totalB,
        },
      }),
    ),
  ]);

  return { sideA: totalA, sideB: totalB };
}

// ─── Tournament-level Athlete Points ─────────────────────────────────────────

/**
 * Returns a map of athleteId → total fantasy points earned in this tournament.
 */
async function computeAthleteTournamentPoints(
  tournamentId: string,
): Promise<Map<string, number>> {
  const rows = await prisma.athleteMatchPoints.findMany({
    where: { match: { tournamentId } },
    select: { athleteId: true, totalPoints: true },
  });

  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(
      row.athleteId,
      (totals.get(row.athleteId) ?? 0) + row.totalPoints,
    );
  }
  return totals;
}

// ─── Lineup Scoring ───────────────────────────────────────────────────────────

/**
 * Recompute LineupSlot.pointsScored for every locked lineup in this tournament.
 * Auto-substitution: if a starter has 0 tournament points but a bench athlete
 * (by benchOrder) has points, promote the first eligible bench athlete.
 * Returns a map of lineupId → total team weekly score.
 */
async function scoreLineups(
  tournamentId: string,
  athletePoints: Map<string, number>,
): Promise<Map<string, number>> {
  // Only score locked lineups (lockedAt set by lockLineups when tournament → LOCKED)
  const lineups = await prisma.lineup.findMany({
    where: { tournamentId, lockedAt: { not: null } },
    select: {
      id: true,
      slots: {
        select: { id: true, athleteId: true, role: true },
      },
    },
  });

  const lineupScores = new Map<string, number>();

  for (const lineup of lineups) {
    const starters = lineup.slots.filter((s) => s.role === "STARTER");

    // Score each starter with their actual tournament points.
    // Auto-substitution is deferred until the scraper provides entry lists (Logic §3.6).
    const updates = lineup.slots.map((slot) => {
      const pts =
        slot.role === "STARTER" ? (athletePoints.get(slot.athleteId) ?? 0) : 0;
      return prisma.lineupSlot.update({
        where: { id: slot.id },
        data: { pointsScored: pts },
      });
    });

    await Promise.all(updates);

    const teamScore = starters.reduce(
      (sum, s) => sum + (athletePoints.get(s.athleteId) ?? 0),
      0,
    );
    lineupScores.set(lineup.id, teamScore);
  }

  return lineupScores;
}

// ─── Standings ────────────────────────────────────────────────────────────────

/**
 * Recompute GameweekStanding for all leagues associated with this tournament's championship.
 */
async function updateStandings(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { championshipId: true },
  });

  // Find all leagues for this championship
  const leagues = await prisma.league.findMany({
    where: { championshipId: tournament.championshipId },
    select: { id: true, rankingMode: true },
  });

  for (const league of leagues) {
    const fantasyTeams = await prisma.fantasyTeam.findMany({
      where: { leagueId: league.id },
      select: {
        id: true,
        lineups: {
          where: { tournamentId, lockedAt: { not: null } }, // lockedAt set by lockLineups
          select: {
            slots: {
              where: { role: "STARTER" },
              select: { pointsScored: true },
            },
          },
        },
      },
    });

    // Compute each team's gameweek score
    const teamScores: { teamId: string; gameweekPoints: number }[] =
      fantasyTeams.map((team) => {
        const gameweekPoints =
          team.lineups[0]?.slots.reduce((sum, s) => sum + s.pointsScored, 0) ??
          0;
        return { teamId: team.id, gameweekPoints };
      });

    if (league.rankingMode === "OVERALL") {
      await updateOverallStandings(league.id, tournamentId, teamScores);
    } else {
      await updateH2HStandings(league.id, tournamentId, teamScores);
    }

    // Update FantasyTeam.totalPoints (cumulative season)
    for (const { teamId } of teamScores) {
      const allStandings = await prisma.gameweekStanding.findMany({
        where: { leagueId: league.id, fantasyTeamId: teamId },
        select: { gameweekPoints: true },
      });
      const totalPoints = allStandings.reduce(
        (sum, s) => sum + s.gameweekPoints,
        0,
      );
      await prisma.fantasyTeam.update({
        where: { id: teamId },
        data: { totalPoints },
      });
    }
  }
}

async function updateOverallStandings(
  leagueId: string,
  tournamentId: string,
  teamScores: { teamId: string; gameweekPoints: number }[],
): Promise<void> {
  // Build cumulative from previous tournaments
  const previousStandings = await prisma.gameweekStanding.groupBy({
    by: ["fantasyTeamId"],
    where: { leagueId, tournamentId: { not: tournamentId } },
    _sum: { gameweekPoints: true },
  });

  const previousMap = new Map(
    previousStandings.map((s) => [s.fantasyTeamId, s._sum.gameweekPoints ?? 0]),
  );

  const ranked = teamScores
    .map((t) => ({
      ...t,
      cumulativePoints: (previousMap.get(t.teamId) ?? 0) + t.gameweekPoints,
    }))
    .sort((a, b) => b.gameweekPoints - a.gameweekPoints);

  await Promise.all(
    ranked.map((t, i) =>
      prisma.gameweekStanding.upsert({
        where: {
          leagueId_fantasyTeamId_tournamentId: {
            leagueId,
            fantasyTeamId: t.teamId,
            tournamentId,
          },
        },
        create: {
          leagueId,
          fantasyTeamId: t.teamId,
          tournamentId,
          gameweekPoints: t.gameweekPoints,
          cumulativePoints: t.cumulativePoints,
          rank: i + 1,
        },
        update: {
          gameweekPoints: t.gameweekPoints,
          cumulativePoints: t.cumulativePoints,
          rank: i + 1,
        },
      }),
    ),
  );
}

async function updateH2HStandings(
  leagueId: string,
  tournamentId: string,
  teamScores: { teamId: string; gameweekPoints: number }[],
): Promise<void> {
  const scoreMap = new Map(teamScores.map((t) => [t.teamId, t.gameweekPoints]));

  // Resolve H2HMatchup outcomes for this tournament
  const matchups = await prisma.h2HMatchup.findMany({
    where: { leagueId, tournamentId },
    select: { id: true, homeTeamId: true, awayTeamId: true },
  });

  for (const matchup of matchups) {
    const homeScore = scoreMap.get(matchup.homeTeamId) ?? 0;
    const awayScore = scoreMap.get(matchup.awayTeamId) ?? 0;

    let homeOutcome: "WIN" | "DRAW" | "LOSS";
    let awayOutcome: "WIN" | "DRAW" | "LOSS";

    if (homeScore > awayScore) {
      homeOutcome = "WIN";
      awayOutcome = "LOSS";
    } else if (homeScore < awayScore) {
      homeOutcome = "LOSS";
      awayOutcome = "WIN";
    } else {
      homeOutcome = "DRAW";
      awayOutcome = "DRAW";
    }

    await prisma.h2HMatchup.update({
      where: { id: matchup.id },
      data: { homeOutcome, awayOutcome },
    });
  }

  // League points: WIN=3, DRAW=1, LOSS=0
  const leaguePointsThisWeek = new Map<string, number>();
  for (const matchup of matchups) {
    const homeScore = scoreMap.get(matchup.homeTeamId) ?? 0;
    const awayScore = scoreMap.get(matchup.awayTeamId) ?? 0;

    if (homeScore > awayScore) {
      leaguePointsThisWeek.set(matchup.homeTeamId, 3);
      leaguePointsThisWeek.set(matchup.awayTeamId, 0);
    } else if (homeScore < awayScore) {
      leaguePointsThisWeek.set(matchup.homeTeamId, 0);
      leaguePointsThisWeek.set(matchup.awayTeamId, 3);
    } else {
      leaguePointsThisWeek.set(matchup.homeTeamId, 1);
      leaguePointsThisWeek.set(matchup.awayTeamId, 1);
    }
  }

  // Teams with a bye get 0 league points but still record gameweekPoints
  for (const { teamId } of teamScores) {
    if (!leaguePointsThisWeek.has(teamId)) {
      leaguePointsThisWeek.set(teamId, 0);
    }
  }

  // Cumulative league points from previous weeks
  const previousStandings = await prisma.gameweekStanding.groupBy({
    by: ["fantasyTeamId"],
    where: { leagueId, tournamentId: { not: tournamentId } },
    _sum: { cumulativePoints: true },
  });

  const previousLeaguePts = new Map(
    previousStandings.map((s) => [
      s.fantasyTeamId,
      s._sum.cumulativePoints ?? 0,
    ]),
  );

  // Rank by cumulative league points; tiebreaker = cumulative fantasy points
  const allTeamsPrev = await prisma.gameweekStanding.groupBy({
    by: ["fantasyTeamId"],
    where: { leagueId, tournamentId: { not: tournamentId } },
    _sum: { gameweekPoints: true },
  });

  const prevFantasyPts = new Map(
    allTeamsPrev.map((s) => [s.fantasyTeamId, s._sum.gameweekPoints ?? 0]),
  );

  const ranked = teamScores
    .map((t) => {
      const weekLeaguePts = leaguePointsThisWeek.get(t.teamId) ?? 0;
      const cumulativeLeaguePts =
        (previousLeaguePts.get(t.teamId) ?? 0) + weekLeaguePts;
      const cumulativeFantasyPts =
        (prevFantasyPts.get(t.teamId) ?? 0) + t.gameweekPoints;
      return {
        teamId: t.teamId,
        gameweekPoints: t.gameweekPoints,
        weekLeaguePts,
        cumulativeLeaguePts,
        cumulativeFantasyPts,
      };
    })
    .sort(
      (a, b) =>
        b.cumulativeLeaguePts - a.cumulativeLeaguePts ||
        b.cumulativeFantasyPts - a.cumulativeFantasyPts,
    );

  await Promise.all(
    ranked.map((t, i) =>
      prisma.gameweekStanding.upsert({
        where: {
          leagueId_fantasyTeamId_tournamentId: {
            leagueId,
            fantasyTeamId: t.teamId,
            tournamentId,
          },
        },
        create: {
          leagueId,
          fantasyTeamId: t.teamId,
          tournamentId,
          gameweekPoints: t.gameweekPoints,
          cumulativePoints: t.cumulativeLeaguePts,
          rank: i + 1,
        },
        update: {
          gameweekPoints: t.gameweekPoints,
          cumulativePoints: t.cumulativeLeaguePts,
          rank: i + 1,
        },
      }),
    ),
  );
}

// ─── Season End ───────────────────────────────────────────────────────────────

/**
 * If all tournaments in a championship are COMPLETED, close all associated leagues.
 */
async function checkAndCloseLeagues(championshipId: string): Promise<void> {
  const remaining = await prisma.tournament.count({
    where: { championshipId, status: { not: "COMPLETED" } },
  });

  if (remaining === 0) {
    await prisma.league.updateMany({
      where: { championshipId },
      data: { isOpen: false },
    });
  }
}

// ─── Lineup Locking ───────────────────────────────────────────────────────────

/**
 * Called when a tournament transitions to LOCKED.
 * - Sets lockedAt = now() on all submitted lineups for teams in this championship's leagues.
 * - Creates fallback lineups (copied from most recent prior tournament) for teams with no lineup.
 *   Teams that have never submitted any lineup score 0 for this tournament.
 */
export async function lockLineups(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { championshipId: true },
  });

  const leagues = await prisma.league.findMany({
    where: { championshipId: tournament.championshipId },
    select: { id: true },
  });

  const now = new Date();

  for (const league of leagues) {
    const teams = await prisma.fantasyTeam.findMany({
      where: { leagueId: league.id },
      select: { id: true },
    });

    for (const team of teams) {
      const existing = await prisma.lineup.findUnique({
        where: {
          fantasyTeamId_tournamentId: { fantasyTeamId: team.id, tournamentId },
        },
        select: { id: true },
      });

      if (existing) {
        // Freeze the submitted lineup
        await prisma.lineup.update({
          where: { id: existing.id },
          data: { lockedAt: now },
        });
      } else {
        // No lineup submitted — look for the most recent prior lineup to copy
        const priorLineup = await prisma.lineup.findFirst({
          where: {
            fantasyTeamId: team.id,
            lockedAt: { not: null },
            tournament: {
              startDate: {
                lt: (
                  await prisma.tournament.findUniqueOrThrow({
                    where: { id: tournamentId },
                    select: { startDate: true },
                  })
                ).startDate,
              },
            },
          },
          orderBy: { tournament: { startDate: "desc" } },
          select: {
            slots: {
              select: { athleteId: true, role: true, benchOrder: true },
            },
          },
        });

        if (priorLineup && priorLineup.slots.length > 0) {
          const fallback = await prisma.lineup.create({
            data: { fantasyTeamId: team.id, tournamentId, lockedAt: now },
            select: { id: true },
          });
          await prisma.lineupSlot.createMany({
            data: priorLineup.slots.map((s) => ({
              lineupId: fallback.id,
              athleteId: s.athleteId,
              role: s.role,
              benchOrder: s.benchOrder,
            })),
          });
        }
        // If no prior lineup exists: team scores 0 — no lineup record created
      }
    }
  }
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Full scoring pipeline for a single match result.
 * Safe to re-run on correction (all upserts are idempotent).
 */
export async function runScoringPipeline(matchId: string): Promise<void> {
  // 1–4: Compute and write AthleteMatchPoints
  await scoreMatch(matchId);

  // Determine tournament
  const { tournamentId } = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    select: { tournamentId: true },
  });

  // 5–6: Aggregate athlete tournament totals and score lineups
  const athletePoints = await computeAthleteTournamentPoints(tournamentId);
  await scoreLineups(tournamentId, athletePoints);

  // 7–8: Update standings (OVERALL + H2H)
  await updateStandings(tournamentId);
}

/**
 * Run the full pipeline for all matches in a tournament.
 * Called when tournament transitions to COMPLETED.
 */
export async function runTournamentCompletion(
  tournamentId: string,
): Promise<void> {
  const { championshipId } = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { championshipId: true },
  });

  const athletePoints = await computeAthleteTournamentPoints(tournamentId);
  await scoreLineups(tournamentId, athletePoints);
  await updateStandings(tournamentId);
  await checkAndCloseLeagues(championshipId);
}
