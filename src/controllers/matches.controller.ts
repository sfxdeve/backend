import type { Request, Response, NextFunction } from "express";
import { getParam, getAccessContext } from "../lib/request.js";
import * as matchService from "../services/match.service.js";
import * as tournamentService from "../services/tournament.service.js";

export async function listMatches(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { tournamentId, phase } = req.query as Record<string, string>;
    await tournamentService.getTournament(tournamentId, getAccessContext(req));
    const matches = await matchService.listMatches({ tournamentId, phase });
    res.json(matches);
  } catch (err) {
    next(err);
  }
}

export async function createMatch(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const match = await matchService.createMatch(req.body);
    res.status(201).json(match);
  } catch (err) {
    next(err);
  }
}

export async function updateMatch(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const matchId = getParam(req, "matchId");
    const match = await matchService.updateMatch(matchId, req.body);
    res.json(match);
  } catch (err) {
    next(err);
  }
}

export async function submitResult(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const matchId = getParam(req, "matchId");
    await matchService.submitResult(matchId, req.body);
    res.json({ message: "Result submitted successfully" });
  } catch (err) {
    next(err);
  }
}
