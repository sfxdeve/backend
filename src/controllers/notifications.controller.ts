import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as notificationsService from "../services/notifications.service.js";
import type { PaginationQuery } from "../lib/pagination.js";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await notificationsService.getUserNotifications(
      req.auth!.userId,
      req.query as unknown as PaginationQuery,
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function markRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await notificationsService.markRead(param(req, "id"), req.auth!.userId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
