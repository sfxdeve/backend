import { Router, type Request, type Response } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { requireAuth, requireAdmin } from "../../middlewares/auth.js";
import * as service from "./service.js";
import {
  MatchQuerySchema,
  type MatchQueryType,
  TournamentParamsSchema,
  type TournamentParamsType,
  MatchParamsSchema,
  type MatchParamsType,
  CreateMatchBodySchema,
  UpdateMatchBodySchema,
  MatchResultBodySchema,
  ImportMatchesBodySchema,
} from "./schema.js";

const router = Router();

router.get(
  "/tournaments/:id/matches",
  requireAuth,
  validateRequest({ params: TournamentParamsSchema, query: MatchQuerySchema }),
  async (req: Request, res: Response) => {
    const result = await service.listByTournament({
      ...(req.params as unknown as TournamentParamsType),
      ...(req.query as unknown as MatchQueryType),
    });

    res.status(200).json(result);
  },
);

router.get(
  "/matches/:id",
  requireAuth,
  validateRequest({ params: MatchParamsSchema }),
  async (req: Request, res: Response) => {
    const result = await service.getById(
      req.params as unknown as MatchParamsType,
    );
    res.status(200).json(result);
  },
);

router.post(
  "/matches",
  requireAdmin,
  validateRequest({ body: CreateMatchBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.create({
      adminId: req.auth!.userId,
      ...req.body,
    });

    res.status(201).json(result);
  },
);

router.patch(
  "/matches/:id",
  requireAdmin,
  validateRequest({ params: MatchParamsSchema, body: UpdateMatchBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.update({
      adminId: req.auth!.userId,
      ...(req.params as unknown as MatchParamsType),
      ...req.body,
    });

    res.status(200).json(result);
  },
);

router.post(
  "/matches/:id/result",
  requireAdmin,
  validateRequest({ params: MatchParamsSchema, body: MatchResultBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.enterResult({
      adminId: req.auth!.userId,
      ...(req.params as unknown as MatchParamsType),
      ...req.body,
    });

    res.status(200).json(result);
  },
);

router.post(
  "/matches/import",
  requireAdmin,
  validateRequest({ body: ImportMatchesBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.importMatches({
      adminId: req.auth!.userId,
      ...req.body,
    });

    res.status(200).json(result);
  },
);

export default router;
