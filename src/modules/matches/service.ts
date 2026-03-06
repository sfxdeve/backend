import { prisma } from "../../prisma/index.js";
import { AppError } from "../../lib/errors.js";
import { paginationMeta, paginationOptions } from "../../lib/pagination.js";
import { runCascade } from "../../scoring/cascade.js";
import { logger } from "../../lib/logger.js";
import { MatchStatus } from "../../prisma/generated/enums.js";
import {
  athleteMatchPointsSelector,
  athleteSelector,
  matchSelector,
  tournamentPairSelector,
  tournamentSelector,
} from "../../prisma/selectors.js";
import type {
  CreateMatchBodyType,
  UpdateMatchBodyType,
  MatchQueryType,
  MatchParamsType,
} from "./schema.js";

function isTerminalStatus(status: MatchStatus): boolean {
  return status === MatchStatus.COMPLETED || status === MatchStatus.CORRECTED;
}

export async function list({
  page,
  limit,
  round,
  status,
  tournamentId,
}: MatchQueryType) {
  const where: Record<string, unknown> = {};

  if (round) {
    where.round = round;
  }

  if (status) {
    where.status = status;
  }

  if (tournamentId) {
    where.tournamentId = tournamentId;
  }

  const options = paginationOptions({ page, limit });

  const [items, total] = await Promise.all([
    prisma.match.findMany({
      where,
      select: {
        ...matchSelector,
        pairA: {
          select: {
            ...tournamentPairSelector,
            athleteA: { select: athleteSelector },
            athleteB: { select: athleteSelector },
          },
        },
        pairB: {
          select: {
            ...tournamentPairSelector,
            athleteA: { select: athleteSelector },
            athleteB: { select: athleteSelector },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      skip: options.skip,
      take: options.take,
    }),
    prisma.match.count({ where }),
  ]);

  return {
    message: "Matches fetched successfully",
    meta: paginationMeta(total, { page, limit }),
    items,
  };
}

export async function getById({ id }: MatchParamsType) {
  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      ...matchSelector,
      pairA: {
        select: {
          ...tournamentPairSelector,
          athleteA: { select: athleteSelector },
          athleteB: { select: athleteSelector },
        },
      },
      pairB: {
        select: {
          ...tournamentPairSelector,
          athleteA: { select: athleteSelector },
          athleteB: { select: athleteSelector },
        },
      },
    },
  });

  if (!match) {
    throw new AppError("NOT_FOUND", "Match not found");
  }

  const athleteMatchPoints = await prisma.athleteMatchPoints.findMany({
    where: { matchId: id },
    select: {
      ...athleteMatchPointsSelector,
      athlete: { select: athleteSelector },
    },
  });

  return {
    message: "Match fetched successfully",
    match: {
      ...match,
      athletePoints: athleteMatchPoints,
    },
  };
}

export async function create({
  adminId,
  ...data
}: { adminId: string } & CreateMatchBodyType) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: data.tournamentId },
    select: tournamentSelector,
  });

  if (!tournament) {
    throw new AppError("NOT_FOUND", "Tournament not found");
  }

  if (data.pairAId === data.pairBId) {
    throw new AppError(
      "BAD_REQUEST",
      "Pair A and Pair B must be different pairs",
    );
  }

  const [pairA, pairB] = await Promise.all([
    prisma.tournamentPair.findUnique({ where: { id: data.pairAId } }),
    prisma.tournamentPair.findUnique({ where: { id: data.pairBId } }),
  ]);

  if (!pairA || !pairB) {
    throw new AppError("NOT_FOUND", "One or both pairs not found");
  }

  if (pairA.tournamentId !== tournament.id) {
    throw new AppError(
      "BAD_REQUEST",
      "Pair A does not belong to this match tournament",
    );
  }

  if (pairB.tournamentId !== tournament.id) {
    throw new AppError(
      "BAD_REQUEST",
      "Pair B does not belong to this match tournament",
    );
  }

  const match = await prisma.match.create({
    data,
    select: {
      ...matchSelector,
      pairA: {
        select: {
          ...tournamentPairSelector,
          athleteA: { select: athleteSelector },
          athleteB: { select: athleteSelector },
        },
      },
      pairB: {
        select: {
          ...tournamentPairSelector,
          athleteA: { select: athleteSelector },
          athleteB: { select: athleteSelector },
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "CREATE_MATCH",
      before: {},
      after: match,
      entityId: match.id,
      entity: "Match",
      adminId,
    },
  });

  return { message: "Match created successfully", match };
}

export async function update({
  adminId,
  id,
  ...body
}: { adminId: string } & MatchParamsType & UpdateMatchBodyType) {
  const existingMatch = await prisma.match.findUnique({ where: { id } });

  if (!existingMatch) {
    throw new AppError("NOT_FOUND", "Match not found");
  }

  const { reason, ...updateFields } = body;

  const nextStatus = updateFields.status ?? existingMatch.status;
  const hasWinnerPairUpdate = Object.prototype.hasOwnProperty.call(
    updateFields,
    "winnerPairId",
  );

  const nextWinnerPairId = hasWinnerPairUpdate
    ? (updateFields.winnerPairId ?? null)
    : existingMatch.winnerPairId;

  const allowedWinnerIds = new Set([
    existingMatch.pairAId,
    existingMatch.pairBId,
  ]);

  if (nextWinnerPairId && !allowedWinnerIds.has(nextWinnerPairId)) {
    throw new AppError(
      "BAD_REQUEST",
      "winnerPairId must reference pairAId or pairBId for this match",
    );
  }

  if (isTerminalStatus(nextStatus) && !nextWinnerPairId) {
    throw new AppError(
      "BAD_REQUEST",
      `winnerPairId is required when status is ${MatchStatus.COMPLETED} or ${MatchStatus.CORRECTED}`,
    );
  }

  const wasTerminal = isTerminalStatus(existingMatch.status);
  const willBeTerminal = isTerminalStatus(nextStatus);

  const { winnerPairId: _winnerPairId, ...restUpdateFields } = updateFields;
  const data: Record<string, unknown> = { ...restUpdateFields };

  if (hasWinnerPairUpdate) {
    data.winnerPairId = updateFields.winnerPairId ?? null;
  } else if (wasTerminal && !willBeTerminal && existingMatch.winnerPairId) {
    data.winnerPairId = null;
  }

  const updatedMatch =
    Object.keys(data).length > 0
      ? await prisma.match.update({
          where: { id },
          data,
          select: matchSelector,
        })
      : existingMatch;

  await prisma.auditLog.create({
    data: {
      action: "UPDATE_MATCH",
      before: existingMatch,
      after: updatedMatch,
      entityId: id,
      entity: "Match",
      reason,
      adminId,
    },
  });

  if (willBeTerminal) {
    try {
      await runCascade(id, "apply");
    } catch (err) {
      logger.error({ err, matchId: id, mode: "apply" }, "Cascade error");
    }
  } else if (wasTerminal && !willBeTerminal) {
    try {
      await runCascade(id, "rollback");
    } catch (err) {
      logger.error({ err, matchId: id, mode: "rollback" }, "Cascade error");
    }
  }

  return { message: "Match updated successfully", match: updatedMatch };
}
