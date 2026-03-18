import { prisma } from "../prisma.js";

export async function getSyncState(contractAddress: string) {
  return prisma.syncState.findUnique({
    where: { contractAddress: contractAddress.toLowerCase() }
  });
}

// TODO: add repository-level checkpoint write helper if needed by syncer.
