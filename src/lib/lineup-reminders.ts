import { prisma } from "../prisma/index.js";
import { logger } from "./logger.js";
import { sendLineupReminder } from "./notifications.js";
import {
  fantasyTeamSelector,
  leagueSelector,
  lineupSelector,
  tournamentSelector,
  userSelector,
} from "../prisma/selectors.js";

const PRE_LOCK_STATUSES = ["UPCOMING", "REGISTRATION_OPEN"] as const;
const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function shouldResetLineupReminder(
  status: string,
  lineupLockAt: Date | null | undefined,
  now = new Date(),
): boolean {
  if (
    !PRE_LOCK_STATUSES.includes(status as (typeof PRE_LOCK_STATUSES)[number])
  ) {
    return false;
  }

  if (!lineupLockAt) {
    return true;
  }

  return lineupLockAt.getTime() > now.getTime() + REMINDER_LEAD_MS;
}

async function collectReminderTargets(
  tournamentId: string,
  championshipId: string,
) {
  const leagues = await prisma.league.findMany({
    where: { championshipId },
    select: leagueSelector,
  });

  const reminderTargets: { email: string; name: string; leagueName: string }[] =
    [];

  for (const league of leagues) {
    const teams = await prisma.fantasyTeam.findMany({
      where: { leagueId: league.id },
      select: {
        ...fantasyTeamSelector,
        user: { select: userSelector },
      },
    });

    for (const team of teams) {
      const existing = await prisma.lineup.findUnique({
        where: {
          fantasyTeamId_tournamentId: { fantasyTeamId: team.id, tournamentId },
        },
        select: lineupSelector,
      });

      if (!existing) {
        reminderTargets.push({
          email: team.user.email,
          name: team.user.name,
          leagueName: league.name,
        });
      }
    }
  }

  return reminderTargets;
}

export async function sendDueLineupReminders(now = new Date()): Promise<void> {
  const upperBound = new Date(now.getTime() + REMINDER_LEAD_MS);
  const tournaments = await prisma.tournament.findMany({
    where: {
      status: { in: [...PRE_LOCK_STATUSES] },
      lineupLockAt: {
        gt: now,
        lte: upperBound,
      },
      lineupReminderSentAt: null,
    },
    select: tournamentSelector,
    orderBy: { lineupLockAt: "asc" },
  });

  for (const tournament of tournaments) {
    const claim = await prisma.tournament.updateMany({
      where: {
        id: tournament.id,
        lineupReminderSentAt: null,
      },
      data: {
        lineupReminderSentAt: now,
      },
    });

    if (claim.count !== 1) {
      continue;
    }

    try {
      const reminderTargets = await collectReminderTargets(
        tournament.id,
        tournament.championshipId,
      );

      if (reminderTargets.length === 0 || !tournament.lineupLockAt) {
        continue;
      }

      await Promise.allSettled(
        reminderTargets.map((target) =>
          sendLineupReminder(
            target.email,
            target.name,
            target.leagueName,
            tournament.lineupLockAt!,
          ),
        ),
      );
    } catch (error) {
      logger.error(
        { error, tournamentId: tournament.id },
        "lineup reminder job failed",
      );
    }
  }
}

export function startLineupReminderScheduler(): () => void {
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;

  const run = async () => {
    try {
      await sendDueLineupReminders();
    } catch (error) {
      logger.error({ error }, "lineup reminder scheduler tick failed");
    }
  };

  void run();
  timer = setInterval(() => {
    void run();
  }, POLL_INTERVAL_MS);

  return () => {
    if (stopped) {
      return;
    }

    stopped = true;

    if (timer) {
      clearInterval(timer);
    }
  };
}
