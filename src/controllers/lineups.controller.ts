import type { Request, Response, NextFunction } from "express";
import { getParam, getAccessContext } from "../lib/request.js";
import * as lineupService from "../services/lineup.service.js";
import * as tournamentService from "../services/tournament.service.js";

export async function getMyLineup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    await tournamentService.getTournament(tournamentId, getAccessContext(req));
    const lineup = await lineupService.getMyLineup(
      req.auth!.userId,
      tournamentId,
    );
    res.json(lineup);
  } catch (err) {
    next(err);
  }
}

export async function saveLineup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    await tournamentService.getTournament(tournamentId, getAccessContext(req));
    const lineup = await lineupService.saveLineup(
      req.auth!.userId,
      tournamentId,
      req.body,
    );
    res.json(lineup);
  } catch (err) {
    next(err);
  }
}
