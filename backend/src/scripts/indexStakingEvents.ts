import { prisma } from "../db/prisma.js";
import { publicClient } from "../blockchain/client.js";
import { scanStakingEvents } from "../indexer/syncer.js";

function parseBlockArg(value: string | undefined, fallback: bigint): bigint {
  if (!value || value.trim() === "") return fallback;
  return BigInt(value);
}

async function main(): Promise<void> {
  const latestBlock = await publicClient.getBlockNumber();
  const fromBlock = parseBlockArg(process.argv[2], latestBlock);
  const toBlock = parseBlockArg(process.argv[3], latestBlock);

  console.info(
    `[indexer] scanning staking events from block ${fromBlock.toString()} to ${toBlock.toString()}`
  );

  const result = await scanStakingEvents(fromBlock, toBlock);

  console.info(`[indexer] scanned logs: ${result.scannedLogs}`);
  console.info(`[indexer] inserted events: ${result.insertedEvents}`);
  console.info(`[indexer] updated users: ${result.updatedUsers}`);
}

main()
  .catch((error) => {
    console.error("[indexer] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
