import { Router, type Request, type Response } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { requireAuth } from "../../middlewares/auth.js";
import * as service from "./service.js";
import { SubmitRosterBody, UpdateRosterBody, SubmitLineupBody } from "./schema.js";

// This router is mounted at /leagues — routes include the :id param.
const router = Router({ mergeParams: true });

router.get("/team", requireAuth, async (req: Request, res: Response) => {
  const data = await service.getTeam(req.params.id as string, req.auth!.userId);
  res.json({ success: true, data });
});

router.post(
  "/team",
  requireAuth,
  validateRequest({ body: SubmitRosterBody }),
  async (req: Request, res: Response) => {
    const data = await service.submitRoster(req.params.id as string, req.auth!.userId, req.body);
    res.status(201).json({ success: true, data });
  },
);

router.patch(
  "/team",
  requireAuth,
  validateRequest({ body: UpdateRosterBody }),
  async (req: Request, res: Response) => {
    const data = await service.updateRoster(req.params.id as string, req.auth!.userId, req.body);
    res.json({ success: true, data });
  },
);

router.get(
  "/team/lineup/:tournamentId",
  requireAuth,
  async (req: Request, res: Response) => {
    const data = await service.getLineup(
      req.params.id as string,
      req.auth!.userId,
      req.params.tournamentId as string,
    );
    res.json({ success: true, data });
  },
);

router.put(
  "/team/lineup/:tournamentId",
  requireAuth,
  validateRequest({ body: SubmitLineupBody }),
  async (req: Request, res: Response) => {
    const data = await service.submitLineup(
      req.params.id as string,
      req.auth!.userId,
      req.params.tournamentId as string,
      req.body,
    );
    res.json({ success: true, data });
  },
);

export default router;
