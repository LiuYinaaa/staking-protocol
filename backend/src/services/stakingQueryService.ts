import { getProtocolStats } from "../db/repositories/protocolStatsRepository.js";
import { getStakingPosition } from "../db/repositories/stakingPositionRepository.js";
import { listLatestStakingEvents } from "../db/repositories/stakingEventRepository.js";

export async function getOverview() {
  // TODO: refine response shape for API contract.
  const [stats, events] = await Promise.all([
    getProtocolStats(),
    listLatestStakingEvents(20)
  ]);

  return { stats, events };
}

export async function getUserPosition(userAddress: string) {
  return getStakingPosition(userAddress);
}
