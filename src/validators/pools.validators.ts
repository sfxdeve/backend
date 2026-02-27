import { z } from "zod";

export const createPoolGroupBody = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(1).max(50),
  poolIndex: z.number().int().min(0).max(3),
  slots: z
    .array(
      z.object({
        position: z.enum(["A", "B", "C", "D"]),
        pairId: z.string().min(1).optional(),
      }),
    )
    .length(4),
});

export const updatePoolGroupBody = z.object({
  slots: z.array(
    z.object({
      position: z.enum(["A", "B", "C", "D"]),
      pairId: z.string().min(1).optional(),
    }),
  ),
});

export const poolGroupIdParam = z.object({
  poolGroupId: z.string().min(1),
});

export const poolListQuery = z.object({
  tournamentId: z.string().min(1),
});
