import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as pairsService from "../services/pairs.service.js";
import type { CreatePairBody, TournamentIdQuery } from "../validators/pairs.js";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { tournamentId } = req.query as TournamentIdQuery;
    const result = await pairsService.listForTournament(tournamentId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { tournamentId } = req.query as TournamentIdQuery;
    const result = await pairsService.create(tournamentId, req.body as CreatePairBody);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function deletePair(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await pairsService.deletePair(param(req, "id"));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
