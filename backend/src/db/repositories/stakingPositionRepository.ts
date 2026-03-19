import { Prisma } from "@prisma/client";

import { prisma } from "../prisma.js";
import type { ParsedEventType } from "../../blockchain/stakingPool.js";

type DbClient = Prisma.TransactionClient | typeof prisma;

export type PositionUpdateResult = {
  userAddress: string;
  previousStakedAmount: bigint;
  newStakedAmount: bigint;
};

export type StakingPositionRecord = {
  userAddress: string;
  stakedAmount: Prisma.Decimal;
  totalClaimedReward: Prisma.Decimal;
  lastUpdatedBlock: bigint;
  lastUpdatedAt: Date;
};

export async function getStakingPosition(
  userAddress: string
): Promise<StakingPositionRecord | null> {
  return prisma.stakingPosition.findUnique({
    where: { userAddress: userAddress.toLowerCase() },
    select: {
      userAddress: true,
      stakedAmount: true,
      totalClaimedReward: true,
      lastUpdatedBlock: true,
      lastUpdatedAt: true
    }
  });
}

export async function upsertStakingPosition(
  userAddress: string,
  type: ParsedEventType,
  amount: bigint,
  blockNumber: bigint,
  db: DbClient = prisma
): Promise<PositionUpdateResult> {
  const normalized = userAddress.toLowerCase();

  const current = await db.stakingPosition.findUnique({
    where: { userAddress: normalized }
  });

  const previousStaked = BigInt(current?.stakedAmount.toString() ?? "0");
  const previousClaimed = BigInt(current?.totalClaimedReward.toString() ?? "0");

  let newStaked = previousStaked;
  let newClaimed = previousClaimed;

  if (type === "stake") {
    newStaked += amount;
  } else if (type === "unstake") {
    if (amount > newStaked) {
      throw new Error(
        `Invalid unstake delta for ${normalized}: amount ${amount} exceeds staked ${newStaked}`
      );
    }
    newStaked -= amount;
  } else {
    newClaimed += amount;
  }

  await db.stakingPosition.upsert({
    where: { userAddress: normalized },
    update: {
      stakedAmount: newStaked.toString(),
      totalClaimedReward: newClaimed.toString(),
      lastUpdatedBlock: blockNumber
    },
    create: {
      userAddress: normalized,
      stakedAmount: newStaked.toString(),
      totalClaimedReward: newClaimed.toString(),
      lastUpdatedBlock: blockNumber
    }
  });

  return {
    userAddress: normalized,
    previousStakedAmount: previousStaked,
    newStakedAmount: newStaked
  };
}
