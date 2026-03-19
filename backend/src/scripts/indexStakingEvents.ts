import { prisma } from "../db/prisma.js";
import { publicClient } from "../blockchain/client.js";
import { STAKING_POOL_ADDRESS } from "../blockchain/stakingPool.js";
import { env } from "../config/env.js";
import { getLastSyncedBlock, saveLastSyncedBlock } from "../indexer/checkpoint.js";
import { scanStakingEvents } from "../indexer/syncer.js";

function parseBlockArg(value: string | undefined, fallback: bigint): bigint {
  if (!value || value.trim() === "") return fallback;
  return BigInt(value);
}

async function main(): Promise<void> {
  const latestBlock = await publicClient.getBlockNumber();
  const argFromBlock = process.argv[2];
  const argToBlock = process.argv[3];

  let fromBlock: bigint;
  let toBlock: bigint;

  if (!argFromBlock && !argToBlock) {
    const checkpoint = await getLastSyncedBlock(STAKING_POOL_ADDRESS);
    fromBlock = checkpoint === null ? env.START_BLOCK : checkpoint + 1n;
    toBlock = latestBlock;
  } else {
    fromBlock = parseBlockArg(argFromBlock, latestBlock);
    toBlock = parseBlockArg(argToBlock, latestBlock);
  }

  console.info(
    `[indexer] scanning staking events from block ${fromBlock.toString()} to ${toBlock.toString()}`
  );

  const result = await scanStakingEvents(fromBlock, toBlock);
  if (fromBlock <= toBlock) {
    await saveLastSyncedBlock(STAKING_POOL_ADDRESS, toBlock);
  }

  console.info(`[indexer] scanned logs: ${result.scannedLogs}`);
  console.info(`[indexer] inserted events: ${result.insertedEvents}`);
  console.info(`[indexer] updated users: ${result.updatedUsers}`);
  console.info(`[indexer] sync checkpoint updated to block: ${toBlock.toString()}`);
}

main()
  .catch((error) => {
    console.error("[indexer] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
