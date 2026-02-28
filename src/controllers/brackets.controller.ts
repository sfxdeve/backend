import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as bracketsService from "../services/brackets.service.js";
import type { TournamentIdQuery } from "../validators/brackets.js";

export async function getForTournament(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { tournamentId } = req.query as unknown as TournamentIdQuery;
    const result = await bracketsService.getForTournament(tournamentId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function generateBracket(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await bracketsService.generateBracket(param(req, "id"));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
