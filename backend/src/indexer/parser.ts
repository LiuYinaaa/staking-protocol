import { decodeEventLog, type Log } from "viem";

import {
  PARSED_EVENT_TYPE_TO_ABI_EVENT_NAME,
  TOPIC_TO_PARSED_EVENT_TYPE,
  stakingPoolEventAbi,
  type ParsedEventType
} from "../blockchain/stakingPool.js";

export type ParsedStakingEvent = {
  type: ParsedEventType;
  user: string;
  amount: bigint;
  txHash: string;
  blockNumber: bigint;
  logIndex: number;
};

export function parseStakingEvent(log: Log): ParsedStakingEvent {
  const topic0 = log.topics[0]?.toLowerCase();
  if (!topic0) {
    throw new Error("Invalid staking event log: missing topics[0]");
  }

  const parsedType = TOPIC_TO_PARSED_EVENT_TYPE[topic0];
  if (!parsedType) {
    throw new Error(`Unsupported staking event topic: ${topic0}`);
  }

  const eventName = PARSED_EVENT_TYPE_TO_ABI_EVENT_NAME[parsedType];
  const decoded = decodeEventLog({
    abi: stakingPoolEventAbi,
    eventName,
    data: log.data,
    topics: log.topics
  });

  const user = String(decoded.args.user).toLowerCase();
  const amount = decoded.args.amount as bigint;

  if (!log.transactionHash || log.blockNumber === null || log.logIndex === null) {
    throw new Error("Invalid staking event log: missing transaction metadata");
  }

  return {
    type: parsedType,
    user,
    amount,
    txHash: log.transactionHash,
    blockNumber: log.blockNumber,
    logIndex: log.logIndex
  };
}

// Backward-compatible alias for older imports.
export const parseStakingLog = parseStakingEvent;
