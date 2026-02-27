import type { Request, Response, NextFunction } from "express";
import { getAccessContext } from "../lib/request.js";
import * as bracketService from "../services/bracket.service.js";
import * as tournamentService from "../services/tournament.service.js";

export async function getBracket(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { tournamentId } = req.query as { tournamentId: string };
    await tournamentService.getTournament(
      tournamentId,
      getAccessContext(req),
    );
    const result = await bracketService.getBracket(tournamentId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
