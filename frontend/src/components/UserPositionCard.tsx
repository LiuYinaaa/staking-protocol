import { formatUnits } from "viem";
import { useEffect, useState } from "react";

import { fetchUserPosition, type UserPosition } from "../api/client";
import { TOKEN_DECIMALS } from "../contracts/addresses";

type Props = {
  address?: string;
  refreshKey: number;
};

export function UserPositionCard({ address, refreshKey }: Props) {
  const [data, setData] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchUserPosition(address)
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load user position"))
      .finally(() => setLoading(false));
  }, [address, refreshKey]);

  return (
    <section className="card">
      <h2>User Position</h2>
      {!address && <p className="muted">Connect wallet to view position.</p>}
      {address && loading && <p className="muted">Loading...</p>}
      {address && error && <p className="error">{error}</p>}
      {address && !loading && !error && data && (
        <div className="grid-2">
          <div className="metric"><span>Staked</span><strong>{formatUnits(BigInt(data.stakedAmount), TOKEN_DECIMALS)}</strong></div>
          <div className="metric"><span>Pending Reward</span><strong>{formatUnits(BigInt(data.pendingReward), TOKEN_DECIMALS)}</strong></div>
          <div className="metric"><span>Total Claimed</span><strong>{formatUnits(BigInt(data.totalClaimedReward), TOKEN_DECIMALS)}</strong></div>
        </div>
      )}
      {address && !loading && !error && !data && <p className="muted">No user position found.</p>}
    </section>
  );
}
