import { getAddress, isAddress } from "viem";
import { Prisma } from "@prisma/client";

import {
  getProtocolStats,
  type ProtocolStatsRecord
} from "../db/repositories/protocolStatsRepository.js";
import {
  getStakingPosition,
  type StakingPositionRecord
} from "../db/repositories/stakingPositionRepository.js";
import {
  listUserStakingEvents,
  type StakingEventRecord
} from "../db/repositories/stakingEventRepository.js";
import { readPendingReward } from "../blockchain/stakingPool.js";

export type UserPositionView = {
  userAddress: string;
  stakedAmount: string;
  totalClaimedReward: string;
  pendingReward: string;
  lastUpdatedBlock: string;
  lastUpdatedAt: string | null;
};

export type UserEventView = {
  eventType: string;
  amount: string;
  txHash: string;
  blockNumber: string;
  timestamp: string;
};

export type ProtocolStatsView = {
  totalStaked: string;
  totalUsers: number;
  totalRewardsClaimed: string;
  lastUpdatedBlock: string;
  updatedAt: string | null;
};

export type QueryApiService = {
  getUserPosition(address: string): Promise<UserPositionView>;
  getUserEvents(address: string, limit: number, offset: number): Promise<UserEventView[]>;
  getProtocolStats(): Promise<ProtocolStatsView>;
};

function normalizeAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error("Invalid address");
  }
  return getAddress(address).toLowerCase();
}

function decimalToIntegerString(value: Prisma.Decimal | null | undefined): string {
  if (!value) return "0";
  return value.toFixed(0);
}

function mapPosition(
  normalizedAddress: string,
  position: StakingPositionRecord | null,
  pendingReward: bigint
): UserPositionView {
  return {
    userAddress: normalizedAddress,
    stakedAmount: decimalToIntegerString(position?.stakedAmount),
    totalClaimedReward: decimalToIntegerString(position?.totalClaimedReward),
    pendingReward: pendingReward.toString(),
    lastUpdatedBlock: position?.lastUpdatedBlock.toString() ?? "0",
    lastUpdatedAt: position?.lastUpdatedAt?.toISOString() ?? null
  };
}

function mapEvent(event: StakingEventRecord): UserEventView {
  return {
    eventType: event.eventType,
    amount: decimalToIntegerString(event.amount),
    txHash: event.txHash,
    blockNumber: event.blockNumber.toString(),
    timestamp: event.timestamp.toISOString()
  };
}

function mapProtocolStats(stats: ProtocolStatsRecord | null): ProtocolStatsView {
  return {
    totalStaked: decimalToIntegerString(stats?.totalStaked),
    totalUsers: stats?.totalUsers ?? 0,
    totalRewardsClaimed: decimalToIntegerString(stats?.totalRewardsClaimed),
    lastUpdatedBlock: stats?.lastUpdatedBlock.toString() ?? "0",
    updatedAt: stats?.updatedAt?.toISOString() ?? null
  };
}

export function createQueryApiService(): QueryApiService {
  return {
    async getUserPosition(address: string): Promise<UserPositionView> {
      const normalizedAddress = normalizeAddress(address);

      const [position, pendingReward] = await Promise.all([
        getStakingPosition(normalizedAddress),
        readPendingReward(normalizedAddress)
      ]);

      return mapPosition(normalizedAddress, position, pendingReward);
    },

    async getUserEvents(
      address: string,
      limit: number,
      offset: number
    ): Promise<UserEventView[]> {
      const normalizedAddress = normalizeAddress(address);
      const events = await listUserStakingEvents(normalizedAddress, limit, offset);
      return events.map(mapEvent);
    },

    async getProtocolStats(): Promise<ProtocolStatsView> {
      const stats = await getProtocolStats();
      return mapProtocolStats(stats);
    }
  };
}
