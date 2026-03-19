import { formatUnits } from "viem";
import { useEffect, useState } from "react";

import { fetchProtocolStats, type ProtocolStats } from "../api/client";
import { TOKEN_DECIMALS } from "../contracts/addresses";

type Props = {
  refreshKey: number;
};

export function ProtocolStatsCard({ refreshKey }: Props) {
  const [data, setData] = useState<ProtocolStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchProtocolStats()
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load protocol stats"))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <section className="card">
      <h2>Protocol Stats</h2>
      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && data && (
        <div className="grid-2">
          <div className="metric"><span>Total Staked</span><strong>{formatUnits(BigInt(data.totalStaked), TOKEN_DECIMALS)}</strong></div>
          <div className="metric"><span>Total Users</span><strong>{data.totalUsers}</strong></div>
          <div className="metric"><span>Total Rewards Claimed</span><strong>{formatUnits(BigInt(data.totalRewardsClaimed), TOKEN_DECIMALS)}</strong></div>
        </div>
      )}
      {!loading && !error && !data && <p className="muted">No protocol stats yet.</p>}
    </section>
  );
}
