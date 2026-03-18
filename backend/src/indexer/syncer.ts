import { env } from "../config/env.js";

export async function syncStakingEvents(): Promise<void> {
  const fromBlock = env.START_BLOCK;

  // TODO: 1) Load checkpoint block from SyncState
  // TODO: 2) Query logs from viem public client
  // TODO: 3) Parse Staked/Unstaked/RewardClaimed logs
  // TODO: 4) Persist events and aggregate state into Postgres
  // TODO: 5) Save new checkpoint

  console.info(`[indexer] sync stub called, fromBlock=${fromBlock}`);
}
