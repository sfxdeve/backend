import { prisma } from "../../prisma/index.js";
import { AppError } from "../../lib/errors.js";
import { paginationMeta, paginationOptions } from "../../lib/pagination.js";
import {
  auditLogSelector,
  userSelector,
  walletSelector,
} from "../../prisma/selectors.js";
import type {
  UsersQueryType,
  UserParamsType,
  UpdateUserBodyType,
} from "./schema.js";

export async function list({ page, limit, email, isBlocked }: UsersQueryType) {
  const options = paginationOptions({ page, limit });

  const where = {
    ...(email
      ? { email: { contains: email, mode: "insensitive" as const } }
      : {}),
    ...(isBlocked !== undefined ? { isBlocked } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelector,
      orderBy: { createdAt: "desc" },
      skip: options.skip,
      take: options.take,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    message: "Users fetched successfully",
    meta: paginationMeta(total, { page, limit }),
    items,
  };
}

export async function getById({ id }: UserParamsType) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...userSelector,
      wallet: { select: walletSelector },
      _count: { select: { memberships: true } },
    },
  });

  if (!user) throw new AppError("NOT_FOUND", "User not found");

  return { message: "User fetched successfully", user };
}

export async function update({
  adminId,
  id,
  ...data
}: { adminId: string } & UserParamsType & UpdateUserBodyType) {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: userSelector,
  });

  if (!existing) throw new AppError("NOT_FOUND", "User not found");

  const user = await prisma.user.update({
    where: { id },
    data,
    select: userSelector,
  });

  await prisma.auditLog.create({
    data: {
      action: "UPDATE_USER",
      entity: "User",
      entityId: id,
      before: existing,
      after: user,
      adminId,
    },
    select: auditLogSelector,
  });

  return { message: "User updated successfully", user };
}
