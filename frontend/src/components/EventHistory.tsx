import { useEffect, useState } from "react";
import { formatUnits } from "viem";

import { fetchUserEvents, type UserEvent } from "../api/client";
import { TOKEN_DECIMALS } from "../contracts/addresses";

type Props = {
  address?: string;
  refreshKey: number;
};

export function EventHistory({ address, refreshKey }: Props) {
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetchUserEvents(address, limit, offset)
      .then((res) => setEvents(res.data))
      .catch((err) => setError(err.message || "Failed to load events"))
      .finally(() => setLoading(false));
  }, [address, limit, offset, refreshKey]);

  return (
    <section className="card">
      <div className="row space-between">
        <h2>User Event History</h2>
        <div className="row">
          <button onClick={() => setOffset((v) => Math.max(0, v - limit))} disabled={offset === 0}>Prev</button>
          <button onClick={() => setOffset((v) => v + limit)} disabled={!address}>Next</button>
        </div>
      </div>

      {!address && <p className="muted">Connect wallet to view event history.</p>}
      {address && loading && <p className="muted">Loading...</p>}
      {address && error && <p className="error">{error}</p>}
      {address && !loading && !error && events.length === 0 && (
        <p className="muted">No events found for this user.</p>
      )}
      {address && !loading && !error && events.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Amount</th>
              <th>Block</th>
              <th>Tx</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={`${event.txHash}-${event.blockNumber}-${event.eventType}`}>
                <td>{event.eventType}</td>
                <td>{formatUnits(BigInt(event.amount), TOKEN_DECIMALS)}</td>
                <td>{event.blockNumber}</td>
                <td><code>{event.txHash.slice(0, 10)}...</code></td>
                <td>{new Date(event.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
