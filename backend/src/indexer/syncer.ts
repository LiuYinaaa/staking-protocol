import { prisma } from "../db/prisma.js";
import { publicClient } from "../blockchain/client.js";
import { STAKING_POOL_ADDRESS } from "../blockchain/stakingPool.js";
import { env } from "../config/env.js";
import { insertStakingEvent } from "../db/repositories/stakingEventRepository.js";
import { updateProtocolStats } from "../db/repositories/protocolStatsRepository.js";
import { upsertStakingPosition } from "../db/repositories/stakingPositionRepository.js";
import { getLastSyncedBlock, saveLastSyncedBlock } from "./checkpoint.js";
import { parseStakingEvent } from "./parser.js";

export type ScanStakingEventsResult = {
  fromBlock: bigint;
  toBlock: bigint;
  scannedLogs: number;
  insertedEvents: number;
  updatedUsers: number;
};

async function resolveBlockTimestamp(
  blockNumber: bigint,
  blockTimestampCache: Map<bigint, Date>
): Promise<Date> {
  const cached = blockTimestampCache.get(blockNumber);
  if (cached) return cached;

  const block = await publicClient.getBlock({ blockNumber });
  const timestamp = new Date(Number(block.timestamp) * 1000);
  blockTimestampCache.set(blockNumber, timestamp);
  return timestamp;
}

export async function scanStakingEvents(
  fromBlock: bigint,
  toBlock: bigint
): Promise<ScanStakingEventsResult> {
  if (fromBlock > toBlock) {
    return {
      fromBlock,
      toBlock,
      scannedLogs: 0,
      insertedEvents: 0,
      updatedUsers: 0
    };
  }

  const logs = await publicClient.getLogs({
    address: STAKING_POOL_ADDRESS,
    fromBlock,
    toBlock
  });

  const blockTimestampCache = new Map<bigint, Date>();
  const updatedUsers = new Set<string>();

  let insertedEvents = 0;

  for (const log of logs) {
    const parsed = parseStakingEvent(log);
    const timestamp = await resolveBlockTimestamp(parsed.blockNumber, blockTimestampCache);

    const inserted = await prisma.$transaction(async (tx) => {
      const eventInsertResult = await insertStakingEvent(
        {
          type: parsed.type,
          user: parsed.user,
          amount: parsed.amount,
          txHash: parsed.txHash,
          blockNumber: parsed.blockNumber,
          logIndex: parsed.logIndex,
          timestamp
        },
        tx
      );

      if (!eventInsertResult.created) {
        return false;
      }

      const positionUpdateResult = await upsertStakingPosition(
        parsed.user,
        parsed.type,
        parsed.amount,
        parsed.blockNumber,
        tx
      );

      const userDelta =
        positionUpdateResult.previousStakedAmount === 0n &&
        positionUpdateResult.newStakedAmount > 0n
          ? 1
          : positionUpdateResult.previousStakedAmount > 0n &&
              positionUpdateResult.newStakedAmount === 0n
            ? -1
            : 0;

      await updateProtocolStats(
        {
          totalStakedDelta:
            parsed.type === "stake"
              ? parsed.amount
              : parsed.type === "unstake"
                ? -parsed.amount
                : 0n,
          totalUsersDelta: userDelta,
          totalRewardsClaimedDelta: parsed.type === "claim" ? parsed.amount : 0n,
          lastUpdatedBlock: parsed.blockNumber
        },
        tx
      );

      return true;
    });

    if (inserted) {
      insertedEvents += 1;
      updatedUsers.add(parsed.user);
    }
  }

  return {
    fromBlock,
    toBlock,
    scannedLogs: logs.length,
    insertedEvents,
    updatedUsers: updatedUsers.size
  };
}

export async function syncStakingEvents(): Promise<ScanStakingEventsResult> {
  const checkpoint = await getLastSyncedBlock(STAKING_POOL_ADDRESS);
  const latestBlock = await publicClient.getBlockNumber();

  const fromBlock = checkpoint === null ? env.START_BLOCK : checkpoint + 1n;
  const toBlock = latestBlock;

  const result = await scanStakingEvents(fromBlock, toBlock);

  if (fromBlock <= toBlock) {
    await saveLastSyncedBlock(STAKING_POOL_ADDRESS, toBlock);
  }

  return result;
}
