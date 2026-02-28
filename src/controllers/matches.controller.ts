import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as matchesService from "../services/matches.service.js";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await matchesService.listForTournament(
      req.query.tournamentId as string,
      req.query as never,
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await matchesService.getById(param(req, "id"));
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
    const result = await matchesService.create(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function updateScore(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await matchesService.updateScore(param(req, "id"), req.body);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function setLive(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await matchesService.setLive(param(req, "id"));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function complete(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await matchesService.complete(param(req, "id"), req.body);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
