import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as seasonsService from "../services/seasons.service.js";
import type { ListSeasonsQuery } from "../services/seasons.service.js";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await seasonsService.list(req.query as unknown as ListSeasonsQuery);
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
    const result = await seasonsService.getById(param(req, "id"));
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
    const result = await seasonsService.create(req.body);
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
    await seasonsService.update(param(req, "id"), req.body);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
