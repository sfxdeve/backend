import mongoose, { type ClientSession } from "mongoose";

export async function withMongoTransaction<T>(
  work: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();

  try {
    let output: T | undefined;
    let hasReturned = false;

    await session.withTransaction(async () => {
      output = await work(session);
      hasReturned = true;
    });

    if (!hasReturned) {
      throw new Error("Transaction completed without a result");
    }

    return output as T;
  } finally {
    await session.endSession();
  }
}
