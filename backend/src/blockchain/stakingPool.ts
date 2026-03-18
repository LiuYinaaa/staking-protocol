import { parseAbi, toEventSelector, type Address } from "viem";

import { env } from "../config/env.js";

export const STAKING_POOL_ADDRESS = env.STAKING_POOL_ADDRESS as Address;

export const stakingPoolAbi = parseAbi([
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event RewardClaimed(address indexed user, uint256 amount)"
]);

export const STAKING_EVENT_SIGNATURES = {
  STAKED: "Staked(address,uint256)",
  UNSTAKED: "Unstaked(address,uint256)",
  REWARD_CLAIMED: "RewardClaimed(address,uint256)"
} as const;

export const STAKING_EVENT_TOPICS = {
  STAKED: toEventSelector(STAKING_EVENT_SIGNATURES.STAKED),
  UNSTAKED: toEventSelector(STAKING_EVENT_SIGNATURES.UNSTAKED),
  REWARD_CLAIMED: toEventSelector(STAKING_EVENT_SIGNATURES.REWARD_CLAIMED)
} as const;

export type ParsedEventType = "stake" | "unstake" | "claim";

export const TOPIC_TO_PARSED_EVENT_TYPE: Record<string, ParsedEventType> = {
  [STAKING_EVENT_TOPICS.STAKED.toLowerCase()]: "stake",
  [STAKING_EVENT_TOPICS.UNSTAKED.toLowerCase()]: "unstake",
  [STAKING_EVENT_TOPICS.REWARD_CLAIMED.toLowerCase()]: "claim"
};

export const PARSED_EVENT_TYPE_TO_ABI_EVENT_NAME: Record<
  ParsedEventType,
  "Staked" | "Unstaked" | "RewardClaimed"
> = {
  stake: "Staked",
  unstake: "Unstaked",
  claim: "RewardClaimed"
};
