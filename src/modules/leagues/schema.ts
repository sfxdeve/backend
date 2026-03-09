import { z } from "zod";
import { paginationSchema } from "../../lib/pagination.js";

export const LeagueQuerySchema = paginationSchema;
export type LeagueQueryType = z.infer<typeof LeagueQuerySchema>;

export const LeagueParamsSchema = z.object({
  id: z.string().uuid(),
});
export type LeagueParamsType = z.infer<typeof LeagueParamsSchema>;

const baseLeagueFields = {
  name: z.string().min(3).max(128),
  championshipId: z.string().uuid(),
  rosterSize: z.number().int().min(1),
  startersSize: z.number().int().min(1),
  budgetPerTeam: z.number().positive(),
  entryFeeCredits: z.number().nonnegative().optional(),
  maxMembers: z.number().int().min(2).optional(),
  prize1st: z.string().max(256).optional(),
  prize2nd: z.string().max(256).optional(),
  prize3rd: z.string().max(256).optional(),
  isMarketEnabled: z.boolean().default(false),
};

// Public league: admin only, rankingMode forced to OVERALL
export const CreatePublicLeagueBodySchema = z
  .object({
    ...baseLeagueFields,
    type: z.literal("PUBLIC"),
  })
  .refine((d) => d.startersSize <= d.rosterSize, {
    message: "startersSize cannot exceed rosterSize",
    path: ["startersSize"],
  });
export type CreatePublicLeagueBodyType = z.infer<
  typeof CreatePublicLeagueBodySchema
>;

// Private league: any user, any rankingMode
export const CreatePrivateLeagueBodySchema = z
  .object({
    ...baseLeagueFields,
    type: z.literal("PRIVATE"),
    rankingMode: z.enum(["OVERALL", "HEAD_TO_HEAD"]).default("OVERALL"),
  })
  .refine((d) => d.startersSize <= d.rosterSize, {
    message: "startersSize cannot exceed rosterSize",
    path: ["startersSize"],
  });
export type CreatePrivateLeagueBodyType = z.infer<
  typeof CreatePrivateLeagueBodySchema
>;

export const CreateLeagueBodySchema = z.discriminatedUnion("type", [
  CreatePublicLeagueBodySchema,
  CreatePrivateLeagueBodySchema,
]);
export type CreateLeagueBodyType = z.infer<typeof CreateLeagueBodySchema>;

export const UpdateLeagueBodySchema = z
  .object({
    name: z.string().min(3).max(128).optional(),
    isOpen: z.boolean().optional(),
    maxMembers: z.number().int().min(2).nullable().optional(),
    prize1st: z.string().max(256).nullable().optional(),
    prize2nd: z.string().max(256).nullable().optional(),
    prize3rd: z.string().max(256).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field required",
  });
export type UpdateLeagueBodyType = z.infer<typeof UpdateLeagueBodySchema>;

export const JoinLeagueBodySchema = z.object({
  joinCode: z.string().optional(),
  teamName: z.string().min(1).max(128),
});
export type JoinLeagueBodyType = z.infer<typeof JoinLeagueBodySchema>;
