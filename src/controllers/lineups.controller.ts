import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as lineupsService from "../services/lineups.service.js";
import type { SetLineupBody } from "../validators/lineups.js";

export async function getLineup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = param(req, "tournamentId");
    const userId = req.auth!.userId;
    const result = await lineupsService.getLineup(userId, tournamentId);
    res.json(result ?? {});
  } catch (e) {
    next(e);
  }
}

export async function setLineup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = param(req, "tournamentId");
    const userId = req.auth!.userId;
    await lineupsService.setLineup(userId, tournamentId, req.body as SetLineupBody);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function lockLineup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = param(req, "tournamentId");
    const userId = req.auth!.userId;
    await lineupsService.lockLineup(userId, tournamentId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
