import type { Address } from "viem";

import { env } from "../config/env.js";

export const STAKING_POOL_ADDRESS = env.STAKING_POOL_ADDRESS as Address;

// TODO: Replace placeholder ABI with generated ABI from contracts/out when event sync is implemented.
export const stakingPoolAbi = [
  // event Staked(address indexed user, uint256 amount)
  // event Unstaked(address indexed user, uint256 amount)
  // event RewardClaimed(address indexed user, uint256 amount)
] as const;

export const STAKING_EVENT_NAMES = {
  STAKED: "Staked",
  UNSTAKED: "Unstaked",
  REWARD_CLAIMED: "RewardClaimed"
} as const;

export type StakingEventName =
  (typeof STAKING_EVENT_NAMES)[keyof typeof STAKING_EVENT_NAMES];
