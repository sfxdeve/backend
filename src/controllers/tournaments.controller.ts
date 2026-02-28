import type { Request, Response, NextFunction } from "express";
import { getParam, getAccessContext } from "../lib/request.js";
import type { BulkEntriesBody } from "../validators/tournaments.validators.js";
import * as tournamentService from "../services/tournament.service.js";

export async function listTournaments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = req.query as unknown as {
      seasonId?: string;
      gender?: string;
      status?: string;
      page: number;
      limit: number;
    };
    const result = await tournamentService.listTournaments(
      { seasonId: q.seasonId, gender: q.gender, status: q.status },
      { page: q.page, limit: q.limit },
      getAccessContext(req),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createTournament(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournament = await tournamentService.createTournament(req.body);
    res.status(201).json(tournament);
  } catch (err) {
    next(err);
  }
}

export async function getTournament(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    const tournament = await tournamentService.getTournament(
      tournamentId,
      getAccessContext(req),
      { requireAuthMessage: true },
    );
    res.json(tournament);
  } catch (err) {
    next(err);
  }
}

export async function updateTournament(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    const tournament = await tournamentService.updateTournament(
      tournamentId,
      req.body,
    );
    res.json(tournament);
  } catch (err) {
    next(err);
  }
}

export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    const userId = req.auth!.userId;
    const registration = await tournamentService.registerUser(
      tournamentId,
      userId,
    );
    res.status(201).json(registration);
  } catch (err) {
    next(err);
  }
}

export async function getLeaderboard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    const result = await tournamentService.getLeaderboard(
      tournamentId,
      getAccessContext(req),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getEntries(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    const entries = await tournamentService.getEntries(
      tournamentId,
      getAccessContext(req),
    );
    res.json(entries);
  } catch (err) {
    next(err);
  }
}

export async function getPlayerStatuses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    const statuses = await tournamentService.getPlayerStatuses(
      tournamentId,
      getAccessContext(req),
    );
    res.json(statuses);
  } catch (err) {
    next(err);
  }
}

export async function inviteUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    const userId = getParam(req, "userId");
    const { invitation, created } = await tournamentService.inviteUser(
      tournamentId,
      userId,
    );
    res.status(created ? 201 : 200).json(invitation);
  } catch (err) {
    next(err);
  }
}

export async function bulkUpsertEntries(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = getParam(req, "tournamentId");
    const { entries } = req.body as BulkEntriesBody;
    const result = await tournamentService.bulkUpsertEntries(
      tournamentId,
      entries,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
