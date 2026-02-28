import type { Request, Response, NextFunction } from "express";
import * as usersService from "../services/users.service.js";
import * as tournamentsService from "../services/tournaments.service.js";
import type { AdminLogsQuery, PriceParamsBody } from "../validators/admin.js";

export async function getLogs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await usersService.getAuditLog(req.query as unknown as AdminLogsQuery);
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
    const { tournamentId, ...params } = req.body as PriceParamsBody;
    await tournamentsService.updatePriceParams(tournamentId, params);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
