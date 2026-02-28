import { Wallet } from "../models/Wallet.js";
import { CreditTransaction } from "../models/CreditTransaction.js";
import { AppError } from "../lib/errors.js";
import {
  CreditTransactionType,
  CreditTransactionSource,
} from "../models/enums.js";
import { paginationOptions, paginationMeta } from "../lib/pagination.js";
import type { PaginationQuery } from "../lib/pagination.js";

export async function getWallet(userId: string) {
  const wallet = await Wallet.findOne({ userId }).lean();
  if (!wallet) throw new AppError("NOT_FOUND", "Wallet not found");
  const recent = await CreditTransaction.find({ walletId: wallet._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  return { ...wallet, recentTransactions: recent };
}

export async function credit(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  source: CreditTransactionSource,
  meta?: Record<string, unknown>,
): Promise<void> {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) throw new AppError("NOT_FOUND", "Wallet not found");
  const balanceAfter = wallet.balance + amount;
  await Wallet.updateOne(
    { _id: wallet._id },
    {
      $set: {
        balance: balanceAfter,
        ...(type === "PURCHASE"
          ? { totalPurchased: wallet.totalPurchased + amount }
          : {}),
      },
    },
  );
  await CreditTransaction.create({
    walletId: wallet._id,
    type,
    source,
    amount,
    balanceAfter,
    meta,
  });
}

export async function debit(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  source: CreditTransactionSource,
  meta?: Record<string, unknown>,
): Promise<void> {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) throw new AppError("NOT_FOUND", "Wallet not found");
  if (wallet.balance < amount)
    throw new AppError("UNPROCESSABLE", "Insufficient balance");
  const balanceAfter = wallet.balance - amount;
  await Wallet.updateOne(
    { _id: wallet._id },
    {
      $set: {
        balance: balanceAfter,
        ...(type === "SPEND" ? { totalSpent: wallet.totalSpent + amount } : {}),
      },
    },
  );
  await CreditTransaction.create({
    walletId: wallet._id,
    type,
    source,
    amount: -amount,
    balanceAfter,
    meta,
  });
}

export async function getTransactions(userId: string, query: PaginationQuery) {
  const wallet = await Wallet.findOne({ userId }).lean();
  if (!wallet) throw new AppError("NOT_FOUND", "Wallet not found");
  const opts = paginationOptions(query);
  const [items, total] = await Promise.all([
    CreditTransaction.find({ walletId: wallet._id })
      .sort({ createdAt: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    CreditTransaction.countDocuments({ walletId: wallet._id }),
  ]);
  return { items, meta: paginationMeta(total, query) };
}
