import type { Request, Response, NextFunction } from "express";
import { getParam, getAccessContext } from "../lib/request.js";
import {
  computeUserTournamentScore,
  getTournamentPlayerScores as getTournamentPlayerScoresService,
} from "../services/scoring.service.js";
import * as tournamentService from "../services/tournament.service.js";

export async function getMyScore(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    await tournamentService.getTournament(tournamentId, getAccessContext(req));
    const userId = req.auth!.userId;
    const result = await computeUserTournamentScore(userId, tournamentId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getTournamentPlayerScores(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    await tournamentService.getTournament(tournamentId, getAccessContext(req));
    const scores = await getTournamentPlayerScoresService(tournamentId);
    res.json(scores);
  } catch (err) {
    next(err);
  }
}
