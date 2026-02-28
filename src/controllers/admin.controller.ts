import type { Request, Response, NextFunction } from "express";
import * as usersService from "../services/users.service.js";
import * as tournamentsService from "../services/tournaments.service.js";
import type { AuditLogQuery } from "../services/users.service.js";

export async function getLogs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await usersService.getAuditLog(req.query as unknown as AuditLogQuery);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function updatePriceParameters(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { tournamentId, ...params } = req.body as {
      tournamentId: string;
      priceVolatilityFactor?: number;
      priceFloor?: number;
      priceCap?: number;
    };
    await tournamentsService.updatePriceParams(tournamentId, params);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
