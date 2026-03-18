import { prisma } from "../prisma.js";

export async function getProtocolStats() {
  return prisma.protocolStats.findUnique({ where: { id: 1 } });
}

// TODO: add transactional update helper for totalStaked/totalUsers/totalRewardsClaimed.
