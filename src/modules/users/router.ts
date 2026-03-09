import { Router, type Request, type Response } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { requireAdmin } from "../../middlewares/auth.js";
import * as service from "./service.js";
import {
  UsersQuerySchema,
  type UsersQueryType,
  UserParamsSchema,
  type UserParamsType,
  UpdateUserBodySchema,
  type UpdateUserBodyType,
} from "./schema.js";

const router = Router();

router.get(
  "/users",
  requireAdmin,
  validateRequest({ query: UsersQuerySchema }),
  async (req: Request, res: Response) => {
    const result = await service.list(req.validated!.query as UsersQueryType);
    res.status(200).json(result);
  },
);

router.get(
  "/users/:id",
  requireAdmin,
  validateRequest({ params: UserParamsSchema }),
  async (req: Request, res: Response) => {
    const result = await service.getById(
      req.validated!.params as UserParamsType,
    );
    res.status(200).json(result);
  },
);

router.patch(
  "/users/:id",
  requireAdmin,
  validateRequest({ params: UserParamsSchema, body: UpdateUserBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.update({
      adminId: req.auth!.userId,
      ...(req.validated!.params as UserParamsType),
      ...(req.validated!.body as UpdateUserBodyType),
    });
    res.status(200).json(result);
  },
);

export default router;
