import type { Request, Response, NextFunction } from "express";
import { getParam } from "../lib/request.js";
import * as userService from "../services/user.service.js";

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await userService.getMe(req.auth!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.updateMe(req.auth!.userId, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = req.query as unknown as { page: number; limit: number };
    const result = await userService.listUsers(q);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function blockUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getParam(req, "userId");
    const user = await userService.blockUser(
      req.auth!.userId,
      userId,
      req.body,
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
}
