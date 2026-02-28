import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as poolsService from "../services/pools.service.js";
import type {
  AssignPairBody,
  CreateGroupBody,
  TournamentIdQuery,
} from "../validators/pools.js";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { tournamentId } = req.query as TournamentIdQuery;
    const result = await poolsService.listGroups(tournamentId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function createGroup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { tournamentId } = req.query as TournamentIdQuery;
    const result = await poolsService.createGroup(tournamentId, req.body as CreateGroupBody);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function assignPair(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const groupId = param(req, "groupId");
    const { pairId } = req.body as AssignPairBody;
    await poolsService.assignPair(groupId, pairId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
