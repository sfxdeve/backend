import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as teamsService from "../services/teams.service.js";

export async function getTeam(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = param(req, "tournamentId");
    const userId = req.auth!.userId;
    const result = await teamsService.getTeam(userId, tournamentId);
    res.json(result ?? {});
  } catch (e) {
    next(e);
  }
}

export async function setTeam(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = param(req, "tournamentId");
    const userId = req.auth!.userId;
    await teamsService.createOrUpdate(userId, tournamentId, req.body);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
