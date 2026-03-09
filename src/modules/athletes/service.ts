import { prisma } from "../../prisma/index.js";
import { AppError } from "../../lib/errors.js";
import { paginationMeta, paginationOptions } from "../../lib/pagination.js";
import {
  athleteSelector,
  auditLogSelector,
  championshipSelector,
} from "../../prisma/selectors.js";
import { computeAthletePrice } from "../../lib/pricing.js";
import { parseImportFile } from "../../lib/parse-import.js";
import { AthleteImportRowSchema } from "./schema.js";
import type {
  AthleteQueryType,
  AthleteParamsType,
  ChampionshipParamsType,
  CreateAthleteBodyType,
  UpdateAthleteBodyType,
} from "./schema.js";

export async function listByChampionship({
  id: championshipId,
  page,
  limit,
}: ChampionshipParamsType & AthleteQueryType) {
  const options = paginationOptions({ page, limit });

  const [items, total] = await Promise.all([
    prisma.athlete.findMany({
      where: { championshipId },
      select: athleteSelector,
      orderBy: [{ rank: "asc" }, { lastName: "asc" }],
      skip: options.skip,
      take: options.take,
    }),
    prisma.athlete.count({ where: { championshipId } }),
  ]);

  return {
    message: "Athletes fetched successfully",
    meta: paginationMeta(total, { page, limit }),
    items,
  };
}

export async function create({
  adminId,
  ...data
}: { adminId: string } & CreateAthleteBodyType) {
  const championship = await prisma.championship.findUnique({
    where: { id: data.championshipId },
    select: championshipSelector,
  });

  if (!championship) {
    throw new AppError("NOT_FOUND", "Championship not found");
  }

  if (championship.gender !== data.gender) {
    throw new AppError(
      "BAD_REQUEST",
      `Athlete gender must match championship gender (${championship.gender})`,
    );
  }

  const cost = computeAthletePrice(data.rank);

  const athlete = await prisma.athlete.create({
    data: { ...data, cost },
    select: athleteSelector,
  });

  await prisma.auditLog.create({
    data: {
      action: "CREATE_ATHLETE",
      entity: "Athlete",
      entityId: athlete.id,
      before: {},
      after: athlete,
      adminId,
    },
    select: auditLogSelector,
  });

  return { message: "Athlete created successfully", athlete };
}

export async function update({
  adminId,
  id,
  ...data
}: { adminId: string } & AthleteParamsType & UpdateAthleteBodyType) {
  const existing = await prisma.athlete.findUnique({
    where: { id },
    select: athleteSelector,
  });

  if (!existing) {
    throw new AppError("NOT_FOUND", "Athlete not found");
  }

  const newRank = data.rank ?? existing.rank;
  const cost = computeAthletePrice(newRank);

  const athlete = await prisma.athlete.update({
    where: { id },
    data: { ...data, cost },
    select: athleteSelector,
  });

  await prisma.auditLog.create({
    data: {
      action: "UPDATE_ATHLETE",
      entity: "Athlete",
      entityId: id,
      before: existing,
      after: athlete,
      adminId,
    },
    select: auditLogSelector,
  });

  return { message: "Athlete updated successfully", athlete };
}

export async function remove({
  adminId,
  id,
}: { adminId: string } & AthleteParamsType) {
  const existing = await prisma.athlete.findUnique({
    where: { id },
    select: athleteSelector,
  });

  if (!existing) {
    throw new AppError("NOT_FOUND", "Athlete not found");
  }

  await prisma.athlete.delete({
    where: { id },
    select: athleteSelector,
  });

  await prisma.auditLog.create({
    data: {
      action: "DELETE_ATHLETE",
      entity: "Athlete",
      entityId: id,
      before: existing,
      after: {},
      adminId,
    },
    select: auditLogSelector,
  });

  return { message: "Athlete deleted successfully" };
}

export async function importAthletes({
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

  // Cache championship lookups to avoid repeated DB calls for the same id
  const championshipCache = new Map<
    string,
    { id: string; gender: string } | null
  >();

  for (let i = 0; i < rawRows.length; i++) {
    const rawRow = rawRows[i]!;

    // Per-row schema validation (handles CSV string→number coercion via z.coerce)
    const parsed = AthleteImportRowSchema.safeParse(rawRow);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      errors.push({ row: i + 1, message: msg });
      continue;
    }

    const row = parsed.data;
    try {
      // Validate championship (cached)
      let championship = championshipCache.get(row.championshipId);
      if (championship === undefined) {
        championship = await prisma.championship.findUnique({
          where: { id: row.championshipId },
          select: championshipSelector,
        });
        championshipCache.set(row.championshipId, championship ?? null);
      }

      if (!championship) {
        errors.push({ row: i + 1, message: "Championship not found" });
        continue;
      }

      if (championship.gender !== row.gender) {
        errors.push({
          row: i + 1,
          message: `Athlete gender must match championship gender (${championship.gender})`,
        });
        continue;
      }

      const cost = computeAthletePrice(row.rank);
      const firstNameTrimmed = row.firstName.trim();
      const lastNameTrimmed = row.lastName.trim();

      const existing = await prisma.athlete.findFirst({
        where: {
          championshipId: row.championshipId,
          firstName: { equals: firstNameTrimmed, mode: "insensitive" },
          lastName: { equals: lastNameTrimmed, mode: "insensitive" },
        },
        select: athleteSelector,
      });

      if (existing) {
        await prisma.athlete.update({
          where: { id: existing.id },
          data: {
            firstName: firstNameTrimmed,
            lastName: lastNameTrimmed,
            rank: row.rank,
            cost,
          },
          select: athleteSelector,
        });
        updated++;
      } else {
        await prisma.athlete.create({
          data: {
            firstName: firstNameTrimmed,
            lastName: lastNameTrimmed,
            gender: row.gender,
            rank: row.rank,
            cost,
            championshipId: row.championshipId,
          },
          select: athleteSelector,
        });
        created++;
      }
    } catch {
      errors.push({ row: i + 1, message: "Unexpected error processing row" });
    }
  }

  await prisma.auditLog.create({
    data: {
      action: "IMPORT_ATHLETES",
      entity: "Athlete",
      entityId: "bulk",
      before: {},
      after: { created, updated, errorCount: errors.length },
      adminId,
    },
    select: auditLogSelector,
  });

  return {
    message: "Athletes import completed",
    created,
    updated,
    errors,
  };
}
