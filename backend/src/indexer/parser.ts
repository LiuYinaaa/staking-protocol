import type { Log } from "viem";

import type { StakingEventName } from "../blockchain/stakingPool.js";

export type ParsedStakingEvent = {
  eventType: StakingEventName;
  userAddress: string;
  amount: string;
  txHash: string;
  blockNumber: bigint;
  logIndex: number;
  timestamp: Date;
};

export function parseStakingLog(_log: Log): ParsedStakingEvent {
  // TODO: Decode log using stakingPoolAbi + event signatures.
  throw new Error("parseStakingLog is not implemented yet");
}
