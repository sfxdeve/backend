import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as scoringService from "../services/scoring.service.js";

export async function getPlayerScores(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { tournamentId, playerId } = req.query as {
      tournamentId: string;
      playerId?: string;
    };
    const result = await scoringService.getPlayerScores(tournamentId, playerId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function getStandings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leagueId = param(req, "leagueId");
    const result = await scoringService.getLeagueStandings(leagueId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function triggerRecompute(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await scoringService.triggerRecompute(param(req, "id"));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
