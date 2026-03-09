import { Router, type Request, type Response } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { requireAuth } from "../../middlewares/auth.js";
import * as service from "./service.js";
import {
  StandingsQuerySchema,
  type StandingsQueryType,
  LeagueParamsSchema,
  type LeagueParamsType,
  GameweekParamsSchema,
  type GameweekParamsType,
} from "./schema.js";

const router = Router();

router.get(
  "/:id/standings",
  requireAuth,
  validateRequest({ params: LeagueParamsSchema, query: StandingsQuerySchema }),
  async (req: Request, res: Response) => {
    const result = await service.getSeasonStandings({
      ...(req.params as unknown as LeagueParamsType),
      ...(req.query as unknown as StandingsQueryType),
    });

    res.status(200).json(result);
  },
);

router.get(
  "/:id/standings/:tournamentId",
  requireAuth,
  validateRequest({
    params: GameweekParamsSchema,
    query: StandingsQuerySchema,
  }),
  async (req: Request, res: Response) => {
    const result = await service.getGameweekStandings({
      ...(req.params as unknown as GameweekParamsType),
      ...(req.query as unknown as StandingsQueryType),
    });

    res.status(200).json(result);
  },
);

router.get(
  "/:id/h2h-schedule",
  requireAuth,
  validateRequest({ params: LeagueParamsSchema }),
  async (req: Request, res: Response) => {
    const result = await service.getH2HSchedule(
      req.params as unknown as LeagueParamsType,
    );

    res.status(200).json(result);
  },
);

export default router;
