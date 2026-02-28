import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as playersService from "../services/players.service.js";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await playersService.list(req.query as never);
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
    const result = await playersService.getById(param(req, "id"));
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
    const result = await playersService.create(req.body);
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
    await playersService.update(param(req, "id"), req.body);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function adjustPrice(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await playersService.adjustPrice(param(req, "id"), req.body);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
