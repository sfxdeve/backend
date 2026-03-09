import { prisma } from "../../prisma/index.js";
import { AppError } from "../../lib/errors.js";
import { paginationMeta, paginationOptions } from "../../lib/pagination.js";
import { athleteSelector } from "../../prisma/selectors.js";
import { computeAthletePrice } from "../../lib/pricing.js";
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
    select: { id: true, gender: true },
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

  await prisma.athlete.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: "DELETE_ATHLETE",
      entity: "Athlete",
      entityId: id,
      before: existing,
      after: {},
      adminId,
    },
  });

  return { message: "Athlete deleted successfully" };
}
