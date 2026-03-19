export type UserPosition = {
  userAddress: string;
  stakedAmount: string;
  pendingReward: string;
  totalClaimedReward: string;
  lastUpdatedBlock: string;
  lastUpdatedAt: string | null;
};

export type UserEvent = {
  eventType: string;
  amount: string;
  txHash: string;
  blockNumber: string;
  timestamp: string;
};

export type ProtocolStats = {
  totalStaked: string;
  totalUsers: number;
  totalRewardsClaimed: string;
  lastUpdatedBlock: string;
  updatedAt: string | null;
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchHealth() {
  return getJson<{ ok: boolean; timestamp: string }>("/health");
}

export async function fetchUserPosition(address: string): Promise<UserPosition> {
  const data = await getJson<{ data: UserPosition }>(`/users/${address}/position`);
  return data.data;
}

export async function fetchUserEvents(
  address: string,
  limit = 20,
  offset = 0
): Promise<{ data: UserEvent[]; pagination: { limit: number; offset: number; count: number } }> {
  return getJson(`/users/${address}/events?limit=${limit}&offset=${offset}`);
}

export async function fetchProtocolStats(): Promise<ProtocolStats> {
  const data = await getJson<{ data: ProtocolStats }>("/protocol/stats");
  return data.data;
}
