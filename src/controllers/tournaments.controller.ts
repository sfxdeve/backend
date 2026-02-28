import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as tournamentsService from "../services/tournaments.service.js";
import type { ListTournamentsQuery } from "../validators/tournaments.js";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await tournamentsService.list(req.query as unknown as ListTournamentsQuery);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function listLive(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await tournamentsService.listLive();
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
    const result = await tournamentsService.getById(param(req, "id"));
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
    const result = await tournamentsService.create(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await tournamentsService.update(param(req, "id"), req.body);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function finalize(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await tournamentsService.finalize(param(req, "id"));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function forceLock(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await tournamentsService.forceLock(param(req, "id"));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
