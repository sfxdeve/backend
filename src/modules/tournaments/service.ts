import { prisma } from "../../prisma/index.js";
import { AppError } from "../../lib/errors.js";
import { paginationMeta, paginationOptions } from "../../lib/pagination.js";
import {
  auditLogSelector,
  championshipSelector,
  leagueSelector,
  tournamentSelector,
  userSelector,
} from "../../prisma/selectors.js";
import { runTournamentCompletion, lockLineups } from "../../lib/scoring.js";
import { sendLockOverrideAlert } from "../../lib/notifications.js";
import { logger } from "../../lib/logger.js";
import { parseImportFile } from "../../lib/parse-import.js";
import { TournamentImportRowSchema } from "./schema.js";
import type {
  TournamentQueryType,
  TournamentParamsType,
  ChampionshipParamsType,
  CreateTournamentBodyType,
  UpdateTournamentBodyType,
  LineupLockOverrideBodyType,
} from "./schema.js";

export async function listByChampionship({
  id: championshipId,
  page,
  limit,
}: ChampionshipParamsType & TournamentQueryType) {
  const options = paginationOptions({ page, limit });

  const [items, total] = await Promise.all([
    prisma.tournament.findMany({
      where: { championshipId },
      select: {
        ...tournamentSelector,
        championshipId: true,
      },
      orderBy: { startDate: "asc" },
      skip: options.skip,
      take: options.take,
    }),
    prisma.tournament.count({ where: { championshipId } }),
  ]);

  return {
    message: "Tournaments fetched successfully",
    meta: paginationMeta(total, { page, limit }),
    items,
  };
}

export async function getById({ id }: TournamentParamsType) {
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      ...tournamentSelector,
      championshipId: true,
    },
  });

  if (!tournament) {
    throw new AppError("NOT_FOUND", "Tournament not found");
  }

  return { message: "Tournament fetched successfully", tournament };
}

export async function create({
  adminId,
  ...data
}: { adminId: string } & CreateTournamentBodyType) {
  const championship = await prisma.championship.findUnique({
    where: { id: data.championshipId },
    select: championshipSelector,
  });

  if (!championship) {
    throw new AppError("NOT_FOUND", "Championship not found");
  }

  const tournament = await prisma.tournament.create({
    data,
    select: {
      ...tournamentSelector,
      championshipId: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "CREATE_TOURNAMENT",
      entity: "Tournament",
      entityId: tournament.id,
      before: {},
      after: tournament,
      adminId,
    },
    select: auditLogSelector,
  });

  return { message: "Tournament created successfully", tournament };
}

export async function update({
  adminId,
  id,
  ...data
}: { adminId: string } & TournamentParamsType & UpdateTournamentBodyType) {
  const existing = await prisma.tournament.findUnique({
    where: { id },
    select: {
      ...tournamentSelector,
      championshipId: true,
    },
  });

  if (!existing) {
    throw new AppError("NOT_FOUND", "Tournament not found");
  }

  const tournament = await prisma.tournament.update({
    where: { id },
    data,
    select: {
      ...tournamentSelector,
      championshipId: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "UPDATE_TOURNAMENT",
      entity: "Tournament",
      entityId: id,
      before: existing,
      after: tournament,
      adminId,
    },
    select: auditLogSelector,
  });

  // Lock all lineups when tournament → LOCKED
  if (data.status === "LOCKED" && existing.status !== "LOCKED") {
    await lockLineups(id);
  }

  // If transitioning to COMPLETED, run the final scoring pipeline
  if (data.status === "COMPLETED" && existing.status !== "COMPLETED") {
    await runTournamentCompletion(id);
  }

  return { message: "Tournament updated successfully", tournament };
}

export async function overrideLineupLock({
  adminId,
  id,
  lineupLockAt,
  reason,
}: { adminId: string } & TournamentParamsType & LineupLockOverrideBodyType) {
  const existing = await prisma.tournament.findUnique({
    where: { id },
    select: {
      ...tournamentSelector,
      championshipId: true,
    },
  });

  if (!existing) {
    throw new AppError("NOT_FOUND", "Tournament not found");
  }

  if (existing.status === "COMPLETED") {
    throw new AppError(
      "BAD_REQUEST",
      "Cannot override lock on a completed tournament",
    );
  }

  const tournament = await prisma.tournament.update({
    where: { id },
    data: { lineupLockAt },
    select: {
      ...tournamentSelector,
      championshipId: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "OVERRIDE_LINEUP_LOCK",
      entity: "Tournament",
      entityId: id,
      before: { lineupLockAt: existing.lineupLockAt },
      after: { lineupLockAt },
      reason: reason ?? null,
      adminId,
    },
    select: auditLogSelector,
  });

  // ── Notify all league members of the updated lock time (fire-and-forget)
  sendLockOverrideAlerts(id, existing.championshipId, lineupLockAt).catch(
    (err) => logger.error({ err }, "lock override alert emails failed"),
  );

  return { message: "Lineup lock updated successfully", tournament };
}

export async function importTournaments({
  adminId,
  buffer,
}: {
  adminId: string;
  buffer: Buffer;
}) {
  const rawRows = parseImportFile(buffer);

  if (rawRows.length === 0) {
    throw new AppError(
      "BAD_REQUEST",
      "The uploaded file contains no data rows",
    );
  }

  let created = 0;
  let updated = 0;
  const errors: { row: number; message: string }[] = [];

  // Cache championship lookups
  const championshipCache = new Map<string, boolean>();

  for (let i = 0; i < rawRows.length; i++) {
    const rawRow = rawRows[i]!;

    const parsed = TournamentImportRowSchema.safeParse(rawRow);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      errors.push({ row: i + 1, message: msg });
      continue;
    }

    const row = parsed.data;
    try {
      // Validate championship (cached)
      let championshipExists = championshipCache.get(row.championshipId);
      if (championshipExists === undefined) {
        const champ = await prisma.championship.findUnique({
          where: { id: row.championshipId },
          select: { id: true },
        });
        championshipExists = champ !== null;
        championshipCache.set(row.championshipId, championshipExists);
      }

      if (!championshipExists) {
        errors.push({ row: i + 1, message: "Championship not found" });
        continue;
      }

      // Upsert by (championshipId, startDate)
      const existing = await prisma.tournament.findFirst({
        where: { championshipId: row.championshipId, startDate: row.startDate },
        select: { id: true },
      });

      if (existing) {
        await prisma.tournament.update({
          where: { id: existing.id },
          data: {
            endDate: row.endDate,
            ...(row.lineupLockAt !== undefined
              ? { lineupLockAt: row.lineupLockAt }
              : {}),
          },
          select: tournamentSelector,
        });
        updated++;
      } else {
        await prisma.tournament.create({
          data: {
            championshipId: row.championshipId,
            startDate: row.startDate,
            endDate: row.endDate,
            lineupLockAt: row.lineupLockAt,
          },
          select: tournamentSelector,
        });
        created++;
      }
    } catch {
      errors.push({ row: i + 1, message: "Unexpected error processing row" });
    }
  }

  await prisma.auditLog.create({
    data: {
      action: "IMPORT_TOURNAMENTS",
      entity: "Tournament",
      entityId: "bulk",
      before: {},
      after: { created, updated, errorCount: errors.length },
      adminId,
    },
    select: auditLogSelector,
  });

  return { message: "Tournaments import completed", created, updated, errors };
}

async function sendLockOverrideAlerts(
  tournamentId: string,
  championshipId: string,
  newLockAt: Date,
): Promise<void> {
  const leagues = await prisma.league.findMany({
    where: { championshipId },
    select: {
      ...leagueSelector,
      memberships: {
        select: {
          user: {
            select: userSelector,
          },
        },
      },
    },
  });

  const tasks: Promise<void>[] = [];
  for (const league of leagues) {
    for (const membership of league.memberships) {
      tasks.push(
        sendLockOverrideAlert(
          membership.user.email,
          membership.user.name,
          league.name,
          newLockAt,
        ),
      );
    }
  }

  await Promise.allSettled(tasks);
}
