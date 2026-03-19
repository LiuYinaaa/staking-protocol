import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";

export function WalletPanel() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <section className="card">
      <h2>Wallet</h2>
      {!isConnected ? (
        <button
          onClick={() => connect({ connector: connectors[0] })}
          disabled={isPending || connectors.length === 0}
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : (
        <>
          <div className="kv"><span>Address</span><code>{address}</code></div>
          <div className="kv"><span>Network</span><span>{chainId}</span></div>
          <button onClick={() => disconnect()}>Disconnect</button>
        </>
      )}
    </section>
  );
}
