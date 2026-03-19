import { Prisma } from "@prisma/client";

import { prisma } from "../prisma.js";

type DbClient = Prisma.TransactionClient | typeof prisma;

export type ProtocolStatsDelta = {
  totalStakedDelta?: bigint;
  totalUsersDelta?: number;
  totalRewardsClaimedDelta?: bigint;
  lastUpdatedBlock: bigint;
};

export type ProtocolStatsRecord = {
  totalStaked: Prisma.Decimal;
  totalUsers: number;
  totalRewardsClaimed: Prisma.Decimal;
  lastUpdatedBlock: bigint;
  updatedAt: Date;
};

export async function getProtocolStats(): Promise<ProtocolStatsRecord | null> {
  return prisma.protocolStats.findUnique({
    where: { id: 1 },
    select: {
      totalStaked: true,
      totalUsers: true,
      totalRewardsClaimed: true,
      lastUpdatedBlock: true,
      updatedAt: true
    }
  });
}

export async function updateProtocolStats(
  delta: ProtocolStatsDelta,
  db: DbClient = prisma
): Promise<void> {
  const current = await db.protocolStats.findUnique({ where: { id: 1 } });

  const currentTotalStaked = BigInt(current?.totalStaked.toString() ?? "0");
  const currentTotalUsers = current?.totalUsers ?? 0;
  const currentTotalRewardsClaimed = BigInt(
    current?.totalRewardsClaimed.toString() ?? "0"
  );

  const nextTotalStaked = currentTotalStaked + (delta.totalStakedDelta ?? 0n);
  const nextTotalUsers = Math.max(0, currentTotalUsers + (delta.totalUsersDelta ?? 0));
  const nextTotalRewardsClaimed =
    currentTotalRewardsClaimed + (delta.totalRewardsClaimedDelta ?? 0n);

  if (nextTotalStaked < 0n || nextTotalRewardsClaimed < 0n) {
    throw new Error("Invalid protocol stats delta: totals cannot be negative");
  }

  await db.protocolStats.upsert({
    where: { id: 1 },
    update: {
      totalStaked: nextTotalStaked.toString(),
      totalUsers: nextTotalUsers,
      totalRewardsClaimed: nextTotalRewardsClaimed.toString(),
      lastUpdatedBlock: delta.lastUpdatedBlock
    },
    create: {
      id: 1,
      totalStaked: nextTotalStaked.toString(),
      totalUsers: nextTotalUsers,
      totalRewardsClaimed: nextTotalRewardsClaimed.toString(),
      lastUpdatedBlock: delta.lastUpdatedBlock
    }
  });
}
