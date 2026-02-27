import type { Request, Response, NextFunction } from "express";
import { getParam, getAccessContext } from "../lib/request.js";
import * as teamService from "../services/team.service.js";
import * as tournamentService from "../services/tournament.service.js";

export async function getMyTeam(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    await tournamentService.getTournament(
      tournamentId,
      getAccessContext(req),
    );
    const team = await teamService.getMyTeam(req.auth!.userId, tournamentId);
    res.json(team);
  } catch (err) {
    next(err);
  }
}

export async function saveTeam(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    await tournamentService.getTournament(
      tournamentId,
      getAccessContext(req),
    );
    const team = await teamService.saveTeam(
      req.auth!.userId,
      tournamentId,
      req.body,
    );
    res.json(team);
  } catch (err) {
    next(err);
  }
}
