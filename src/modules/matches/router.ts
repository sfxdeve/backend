import { Router, type Request, type Response } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { requireAuth, requireAdmin } from "../../middlewares/auth.js";
import { importUpload } from "../../middlewares/upload.js";
import { AppError } from "../../lib/errors.js";
import * as service from "./service.js";
import {
  MatchQuerySchema,
  type MatchQueryType,
  TournamentParamsSchema,
  type TournamentParamsType,
  MatchParamsSchema,
  type MatchParamsType,
  CreateMatchBodySchema,
  type CreateMatchBodyType,
  UpdateMatchBodySchema,
  type UpdateMatchBodyType,
  MatchResultBodySchema,
  type MatchResultBodyType,
} from "./schema.js";

const router = Router();

router.get(
  "/tournaments/:id/matches",
  requireAuth,
  validateRequest({ params: TournamentParamsSchema, query: MatchQuerySchema }),
  async (req: Request, res: Response) => {
    const result = await service.listByTournament({
      ...(req.validated!.params as TournamentParamsType),
      ...(req.validated!.query as MatchQueryType),
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
      req.validated!.params as MatchParamsType,
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
      ...(req.validated!.body as CreateMatchBodyType),
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
      ...(req.validated!.params as MatchParamsType),
      ...(req.validated!.body as UpdateMatchBodyType),
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
      ...(req.validated!.params as MatchParamsType),
      ...(req.validated!.body as MatchResultBodyType),
    });

    res.status(200).json(result);
  },
);

router.post(
  "/matches/import",
  requireAdmin,
  importUpload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError(
        "BAD_REQUEST",
        "A CSV or Excel file is required (field name: file)",
      );
    }

    const result = await service.importMatches({
      adminId: req.auth!.userId,
      buffer: req.file.buffer,
    });

    res.status(200).json(result);
  },
);

export default router;
