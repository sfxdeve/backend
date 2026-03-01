import { z } from "zod";
import { Gender } from "../../models/enums.js";

export const CreateChampionshipBody = z.object({
  name: z.string().min(2).max(200),
  gender: z.enum([Gender.M, Gender.F]),
  seasonYear: z.number().int().min(2020).max(2100),
});

export const UpdateChampionshipBody = CreateChampionshipBody.partial();

export type CreateChampionshipBodyType = z.infer<typeof CreateChampionshipBody>;
export type UpdateChampionshipBodyType = z.infer<typeof UpdateChampionshipBody>;
