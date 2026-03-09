import { Router, type Request, type Response } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { requireAuth, requireAdmin } from "../../middlewares/auth.js";
import { importUpload } from "../../middlewares/upload.js";
import { AppError } from "../../lib/errors.js";
import * as service from "./service.js";
import {
  TournamentQuerySchema,
  type TournamentQueryType,
  ChampionshipParamsSchema,
  type ChampionshipParamsType,
  TournamentParamsSchema,
  type TournamentParamsType,
  CreateTournamentBodySchema,
  type CreateTournamentBodyType,
  UpdateTournamentBodySchema,
  type UpdateTournamentBodyType,
  LineupLockOverrideBodySchema,
  type LineupLockOverrideBodyType,
} from "./schema.js";

const router = Router();

router.get(
  "/championships/:id/tournaments",
  requireAuth,
  validateRequest({
    params: ChampionshipParamsSchema,
    query: TournamentQuerySchema,
  }),
  async (req: Request, res: Response) => {
    const result = await service.listByChampionship({
      ...(req.validated!.params as ChampionshipParamsType),
      ...(req.validated!.query as TournamentQueryType),
    });

    res.status(200).json(result);
  },
);

router.get(
  "/tournaments/:id",
  requireAuth,
  validateRequest({ params: TournamentParamsSchema }),
  async (req: Request, res: Response) => {
    const result = await service.getById(
      req.validated!.params as TournamentParamsType,
    );
    res.status(200).json(result);
  },
);

router.post(
  "/tournaments",
  requireAdmin,
  validateRequest({ body: CreateTournamentBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.create({
      adminId: req.auth!.userId,
      ...(req.validated!.body as CreateTournamentBodyType),
    });

    res.status(201).json(result);
  },
);

router.patch(
  "/tournaments/:id",
  requireAdmin,
  validateRequest({
    params: TournamentParamsSchema,
    body: UpdateTournamentBodySchema,
  }),
  async (req: Request, res: Response) => {
    const result = await service.update({
      adminId: req.auth!.userId,
      ...(req.validated!.params as TournamentParamsType),
      ...(req.validated!.body as UpdateTournamentBodyType),
    });

    res.status(200).json(result);
  },
);

router.patch(
  "/tournaments/:id/lineup-lock",
  requireAdmin,
  validateRequest({
    params: TournamentParamsSchema,
    body: LineupLockOverrideBodySchema,
  }),
  async (req: Request, res: Response) => {
    const result = await service.overrideLineupLock({
      adminId: req.auth!.userId,
      ...(req.validated!.params as TournamentParamsType),
      ...(req.validated!.body as LineupLockOverrideBodyType),
    });

    res.status(200).json(result);
  },
);

router.post(
  "/tournaments/import",
  requireAdmin,
  importUpload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError(
        "BAD_REQUEST",
        "A CSV or Excel file is required (field name: file)",
      );
    }

    const result = await service.importTournaments({
      adminId: req.auth!.userId,
      buffer: req.file.buffer,
    });

    res.status(200).json(result);
  },
);

export default router;
