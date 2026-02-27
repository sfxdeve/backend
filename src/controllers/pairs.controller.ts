import type { Request, Response, NextFunction } from "express";
import { getParam, getAccessContext } from "../lib/request.js";
import * as pairService from "../services/pair.service.js";
import * as tournamentService from "../services/tournament.service.js";

export async function listPairs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { tournamentId } = req.query as { tournamentId: string };
    await tournamentService.getTournament(
      tournamentId,
      getAccessContext(req),
    );
    const pairs = await pairService.listPairs(tournamentId);
    res.json(pairs);
  } catch (err) {
    next(err);
  }
}

export async function createPair(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pair = await pairService.createPair(req.body);
    res.status(201).json(pair);
  } catch (err) {
    next(err);
  }
}

export async function deletePair(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pairId = getParam(req, "pairId");
    await pairService.deletePair(pairId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
