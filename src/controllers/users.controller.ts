import type { Request, Response, NextFunction } from "express";
import { param } from "../lib/params.js";
import * as usersService from "../services/users.service.js";

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth!.userId;
    const result = await usersService.getProfile(userId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth!.userId;
    await usersService.updateProfile(userId, req.body);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth!.userId;
    await usersService.changePassword(userId, req.body);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await usersService.listUsers(req.query as never);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function blockUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { blocked } = req.body;
    await usersService.blockUser(param(req, "id"), blocked);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function getAuditLog(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await usersService.getAuditLog(req.query as never);
    res.json(result);
  } catch (e) {
    next(e);
  }
}
