import type { ClientSession } from "mongoose";
import { Wallet } from "../models/Wallet.js";
import { CreditTransaction } from "../models/CreditTransaction.js";
import { AppError } from "../lib/errors.js";
import { withMongoTransaction } from "../lib/tx.js";

export async function creditFromPurchase(
  userId: string,
  amount: number,
  paymentIntentId: string,
  session: ClientSession,
) {
  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount, totalPurchased: amount } },
    { new: true, session },
  );
  let w = wallet;
  if (!w) {
    w = await Wallet.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          balance: amount,
          totalPurchased: amount,
          totalSpent: 0,
        },
      },
      { upsert: true, new: true, session },
    );
    if (!w) throw new AppError("INTERNAL_SERVER_ERROR", "Wallet update failed");
  }

  await CreditTransaction.create(
    [
      {
        userId,
        amount,
        type: "PURCHASE",
        source: "STRIPE",
        metadata: { paymentIntentId: paymentIntentId },
        balanceAfter: w.balance,
      },
    ],
    { session },
  );
  return w;
}

const RECENT_TRANSACTIONS_LIMIT = 50;

export async function getOrCreateWallet(userId: string) {
  let wallet = await Wallet.findOne({ userId }).lean();
  if (!wallet) {
    wallet = (
      await Wallet.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            userId,
            balance: 0,
            totalPurchased: 0,
            totalSpent: 0,
          },
        },
        { upsert: true, new: true },
      )
    ).toObject();
  }
  return wallet;
}

export async function getWalletWithTransactions(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  const transactions = await CreditTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(RECENT_TRANSACTIONS_LIMIT)
    .lean();
  return { wallet, transactions };
}

export async function spend(userId: string, amount: number, reason: string) {
  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new AppError("BAD_REQUEST", "Amount must be a positive integer");
  }

  return withMongoTransaction(async (session) => {
    await Wallet.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: { userId, balance: 0, totalPurchased: 0, totalSpent: 0 },
      },
      { upsert: true, session },
    );

    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: -amount, totalSpent: amount } },
      { new: true, session },
    );
    if (!wallet || wallet.balance < 0) {
      throw new AppError("BAD_REQUEST", "Insufficient balance");
    }

    await CreditTransaction.create(
      [
        {
          userId,
          amount: -amount,
          type: "SPEND",
          source: "SYSTEM",
          metadata: { reason },
          balanceAfter: wallet.balance,
        },
      ],
      { session },
    );
    return wallet;
  });
}

export async function adjust(
  userId: string,
  amount: number,
  reason: string,
  session?: ClientSession,
) {
  if (!Number.isInteger(amount) || amount === 0) {
    throw new AppError("BAD_REQUEST", "Amount must be a non-zero integer");
  }

  const run = async (s: ClientSession) => {
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { new: true, session: s },
    );
    let w = wallet;
    if (!w) {
      w = await Wallet.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            userId,
            balance: amount,
            totalPurchased: 0,
            totalSpent: 0,
          },
        },
        { upsert: true, new: true, session: s },
      );
      if (!w)
        throw new AppError("INTERNAL_SERVER_ERROR", "Wallet creation failed");
    }
    if (w.balance < 0) {
      throw new AppError(
        "BAD_REQUEST",
        "Adjustment would result in negative balance",
      );
    }

    await CreditTransaction.create(
      [
        {
          userId,
          amount,
          type: amount > 0 ? "BONUS" : "SPEND",
          source: "ADMIN",
          metadata: { reason },
          balanceAfter: w.balance,
        },
      ],
      { session: s },
    );
    return w;
  };

  if (session) return run(session);
  return withMongoTransaction(run);
}
