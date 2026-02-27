import type { Request, Response, NextFunction } from "express";
import { getParam } from "../lib/request.js";
import type {
  CreateLeagueBody,
  JoinByCodeBody,
} from "../validators/leagues.validators.js";
import * as leagueService from "../services/league.service.js";

export async function listLeagues(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = req.query as unknown as {
      isPublic?: boolean;
      tournamentId?: string;
      page: number;
      limit: number;
    };
    const result = await leagueService.listLeagues({
      userId: req.auth?.userId,
      isAdmin: req.auth?.role === "ADMIN",
      isPublic: q.isPublic,
      tournamentId: q.tournamentId,
      page: q.page,
      limit: q.limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createLeague(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth!.userId;
    const body = req.body as CreateLeagueBody;
    const league = await leagueService.createLeague({
      userId,
      tournamentId: body.tournamentId,
      name: body.name,
      startDate: new Date(body.startDate),
      isPublic: body.isPublic ?? true,
      inviteCode: body.inviteCode,
      playerAvailability: body.playerAvailability,
      gameMode: body.gameMode,
      typology: body.typology,
      banner: body.banner,
    });
    res.status(201).json(league);
  } catch (err) {
    next(err);
  }
}

export async function joinLeague(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leagueId = getParam(req, "leagueId");
    const userId = req.auth!.userId;
    await leagueService.joinLeague(leagueId, userId);
    res.status(201).json({ message: "Joined league" });
  } catch (err) {
    next(err);
  }
}

export async function joinByCode(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { inviteCode } = req.body as JoinByCodeBody;
    const userId = req.auth!.userId;
    await leagueService.joinLeagueByCode(inviteCode, userId);
    res.status(201).json({ message: "Joined league" });
  } catch (err) {
    next(err);
  }
}

export async function getLeague(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leagueId = getParam(req, "leagueId");
    const result = await leagueService.getLeagueById(
      leagueId,
      req.auth?.userId,
      req.auth?.role === "ADMIN",
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getLeagueLeaderboard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const leagueId = getParam(req, "leagueId");
    const result = await leagueService.getLeagueLeaderboard(
      leagueId,
      req.auth?.userId,
      req.auth?.role === "ADMIN",
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
