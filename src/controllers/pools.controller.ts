import type { Request, Response, NextFunction } from "express";
import { getParam, getAccessContext } from "../lib/request.js";
import * as poolService from "../services/pool.service.js";
import * as tournamentService from "../services/tournament.service.js";

export async function listPools(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { tournamentId } = req.query as { tournamentId: string };
    await tournamentService.getTournament(tournamentId, getAccessContext(req));
    const pools = await poolService.listPools(tournamentId);
    res.json(pools);
  } catch (err) {
    next(err);
  }
}

export async function createPoolGroup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pool = await poolService.createPoolGroup(req.body);
    res.status(201).json(pool);
  } catch (err) {
    next(err);
  }
}

export async function updatePoolGroup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const poolGroupId = getParam(req, "poolGroupId");
    const pool = await poolService.updatePoolGroup(poolGroupId, req.body);
    res.json(pool);
  } catch (err) {
    next(err);
  }
}
