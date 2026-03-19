import { useState } from "react";
import { useAccount } from "wagmi";

import { WalletPanel } from "./components/WalletPanel";
import { UserPositionCard } from "./components/UserPositionCard";
import { ProtocolStatsCard } from "./components/ProtocolStatsCard";
import { StakeForm } from "./components/StakeForm";
import { UnstakeClaimPanel } from "./components/UnstakeClaimPanel";
import { EventHistory } from "./components/EventHistory";

export default function App() {
  const { address } = useAccount();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleActionSuccess = () => {
    setRefreshKey((v) => v + 1);
  };

  return (
    <main className="container">
      <header>
        <h1>Staking Dashboard</h1>
        <p className="muted">Minimal staking protocol dashboard for local demo.</p>
      </header>

      <div className="layout-2">
        <WalletPanel />
        <ProtocolStatsCard refreshKey={refreshKey} />
      </div>

      <UserPositionCard address={address} refreshKey={refreshKey} />

      <div className="layout-2">
        <StakeForm onActionSuccess={handleActionSuccess} />
        <UnstakeClaimPanel onActionSuccess={handleActionSuccess} />
      </div>

      <EventHistory address={address} refreshKey={refreshKey} />
    </main>
  );
}
