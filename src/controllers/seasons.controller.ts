import type { Request, Response, NextFunction } from "express";
import { getParam } from "../lib/request.js";
import * as seasonService from "../services/season.service.js";

export async function listSeasons(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const seasons = await seasonService.listSeasons();
    res.json(seasons);
  } catch (err) {
    next(err);
  }
}

export async function createSeason(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const season = await seasonService.createSeason(req.body);
    res.status(201).json(season);
  } catch (err) {
    next(err);
  }
}

export async function updateSeason(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const seasonId = getParam(req, "seasonId");
    const season = await seasonService.updateSeason(seasonId, req.body);
    res.json(season);
  } catch (err) {
    next(err);
  }
}
