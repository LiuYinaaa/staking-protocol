import { prisma } from "../db/prisma.js";

export async function getLastSyncedBlock(contractAddress: string): Promise<bigint | null> {
  const state = await prisma.syncState.findUnique({
    where: { contractAddress: contractAddress.toLowerCase() }
  });

  return state?.lastSyncedBlock ?? null;
}

export async function saveLastSyncedBlock(
  contractAddress: string,
  lastSyncedBlock: bigint
): Promise<void> {
  await prisma.syncState.upsert({
    where: { contractAddress: contractAddress.toLowerCase() },
    update: { lastSyncedBlock },
    create: {
      contractAddress: contractAddress.toLowerCase(),
      lastSyncedBlock
    }
  });
}
