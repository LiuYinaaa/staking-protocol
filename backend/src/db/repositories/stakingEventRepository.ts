import { Prisma } from "@prisma/client";

import { prisma } from "../prisma.js";
import type { ParsedEventType } from "../../blockchain/stakingPool.js";

type DbClient = Prisma.TransactionClient | typeof prisma;

export type InsertStakingEventInput = {
  type: ParsedEventType;
  user: string;
  amount: bigint;
  txHash: string;
  blockNumber: bigint;
  logIndex: number;
  timestamp: Date;
};

export async function listLatestStakingEvents(limit = 50) {
  return prisma.stakingEvent.findMany({
    orderBy: [{ blockNumber: "desc" }, { logIndex: "desc" }],
    take: limit
  });
}

export async function insertStakingEvent(
  input: InsertStakingEventInput,
  db: DbClient = prisma
): Promise<{ created: boolean }> {
  const eventType =
    input.type === "stake"
      ? "Staked"
      : input.type === "unstake"
        ? "Unstaked"
        : "RewardClaimed";

  try {
    await db.stakingEvent.create({
      data: {
        eventType,
        userAddress: input.user,
        amount: input.amount.toString(),
        txHash: input.txHash,
        blockNumber: input.blockNumber,
        logIndex: input.logIndex,
        timestamp: input.timestamp
      }
    });

    return { created: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { created: false };
    }

    throw error;
  }
}
