import { prisma } from "../prisma.js";

export async function listLatestStakingEvents(limit = 50) {
  return prisma.stakingEvent.findMany({
    orderBy: [{ blockNumber: "desc" }, { logIndex: "desc" }],
    take: limit
  });
}

// TODO: add createManyStakingEvents with dedupe support on (txHash, logIndex).
