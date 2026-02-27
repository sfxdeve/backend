import type { Request, Response, NextFunction } from "express";
import { getParam } from "../lib/request.js";
import * as playerService from "../services/player.service.js";

export async function listPlayers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = req.query as unknown as {
      gender?: "M" | "W";
      search?: string;
      page: number;
      limit: number;
    };
    const result = await playerService.listPlayers(
      { gender: q.gender, search: q.search },
      { page: q.page, limit: q.limit },
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createPlayer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const player = await playerService.createPlayer(req.body);
    res.status(201).json(player);
  } catch (err) {
    next(err);
  }
}

export async function updatePlayer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const playerId = getParam(req, "playerId");
    const player = await playerService.updatePlayer(playerId, req.body);
    res.json(player);
  } catch (err) {
    next(err);
  }
}

export async function getPlayerStats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const playerId = getParam(req, "playerId");
    const result = await playerService.getPlayerStats(playerId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
