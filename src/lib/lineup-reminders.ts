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

export async function sendDueLineupReminders(): Promise<void> {}

export function startLineupReminderScheduler(): () => void {
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;

  const run = async () => {
    await sendDueLineupReminders();
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
