import { User } from "../models/Auth.js";
import { CreditPack } from "../models/CreditPack.js";
import { hashSecret } from "./hash.js";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function seedAdmin(): Promise<void> {
  const existing = await User.findOne({ role: "ADMIN" }).lean();

  if (existing) return;

  const passwordHash = await hashSecret(env.ADMIN_PASSWORD);

  await User.create({
    email: env.ADMIN_EMAIL,
    name: env.ADMIN_NAME,
    passwordHash,
    role: "ADMIN",
    isVerified: true,
    isBlocked: false,
  });

  logger.info({ email: env.ADMIN_EMAIL }, "Default admin created");
}

export async function seedCreditPacks(): Promise<void> {
  const count = await CreditPack.countDocuments().lean();
  if (count > 0) return;

  await CreditPack.insertMany([
    {
      name: "Starter",
      credits: 100,
      stripePriceId: "price_placeholder_starter",
      active: true,
    },
    {
      name: "Medium",
      credits: 500,
      stripePriceId: "price_placeholder_medium",
      active: true,
    },
    {
      name: "Premium",
      credits: 1200,
      stripePriceId: "price_placeholder_premium",
      active: true,
    },
  ]);

  logger.info("Credit packs seeded");
}
