import { prisma } from "../prisma.js";

export async function getStakingPosition(userAddress: string) {
  return prisma.stakingPosition.findUnique({
    where: { userAddress: userAddress.toLowerCase() }
  });
}

// TODO: add upsert/update helpers for indexer aggregation.
