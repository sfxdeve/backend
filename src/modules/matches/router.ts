import { Router, type Request, type Response } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { requireAuth, requireAdmin } from "../../middlewares/auth.js";
import * as service from "./service.js";
import {
  type MatchQueryType,
  MatchQuerySchema,
  type MatchParamsType,
  MatchParamsSchema,
  CreateMatchBodySchema,
  UpdateMatchBodySchema,
} from "./schema.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validateRequest({ query: MatchQuerySchema }),
  async (req: Request, res: Response) => {
    const result = await service.list(
      req.query as unknown as MatchQueryType,
    );

    res.status(200).json(result);
  },
);

router.get(
  "/:id",
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
  "/",
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
  "/:id",
  requireAdmin,
  validateRequest({ params: MatchParamsSchema }),
  validateRequest({ body: UpdateMatchBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.update({
      adminId: req.auth!.userId,
      ...(req.params as unknown as MatchParamsType),
      ...req.body,
    });

    res.status(200).json(result);
  },
);

export default router;
