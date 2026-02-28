import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as leaguesService from "../services/leagues.service.js";
import type { ListLeaguesQuery } from "../services/leagues.service.js";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await leaguesService.listPublic(req.query as unknown as ListLeaguesQuery);
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
    const result = await leaguesService.getById(param(req, "id"));
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function getStandings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await leaguesService.getStandings(param(req, "id"));
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
    const userId = req.auth!.userId;
    const result = await leaguesService.create(userId, req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function join(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth!.userId;
    const { inviteCode } = req.body as { inviteCode?: string };
    await leaguesService.join(userId, param(req, "id"), inviteCode);
    res.status(204).send();
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
    const userId = req.auth!.userId;
    const isAdmin = req.auth!.role === "ADMIN";
    await leaguesService.update(param(req, "id"), userId, isAdmin, req.body);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
