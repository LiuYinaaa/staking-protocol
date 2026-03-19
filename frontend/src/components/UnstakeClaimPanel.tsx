import { useEffect, useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { STAKING_POOL_ADDRESS, TOKEN_DECIMALS } from "../contracts/addresses";
import { stakingPoolAbi } from "../contracts/stakingPoolAbi";

type Props = {
  onActionSuccess: () => void;
};

export function UnstakeClaimPanel({ onActionSuccess }: Props) {
  const { isConnected } = useAccount();
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<"unstake" | "claim" | null>(null);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const unstakeWei = useMemo(() => {
    try {
      if (!unstakeAmount) return 0n;
      return parseUnits(unstakeAmount, TOKEN_DECIMALS);
    } catch {
      return -1n;
    }
  }, [unstakeAmount]);

  const handleUnstake = () => {
    setError(null);

    if (!isConnected) {
      setError("Connect wallet first.");
      return;
    }
    if (unstakeWei <= 0n) {
      setError("Enter a valid unstake amount.");
      return;
    }

    setIntent("unstake");
    writeContract({
      abi: stakingPoolAbi,
      address: STAKING_POOL_ADDRESS,
      functionName: "unstake",
      args: [unstakeWei]
    });
  };

  const handleClaim = () => {
    setError(null);
    if (!isConnected) {
      setError("Connect wallet first.");
      return;
    }

    setIntent("claim");
    writeContract({
      abi: stakingPoolAbi,
      address: STAKING_POOL_ADDRESS,
      functionName: "claimReward",
      args: []
    });
  };

  useEffect(() => {
    if (!isTxSuccess || !intent) return;
    onActionSuccess();
  }, [intent, isTxSuccess, onActionSuccess]);

  return (
    <section className="card">
      <h2>Unstake / Claim</h2>
      <div className="field">
        <label htmlFor="unstake-amount">Unstake Amount</label>
        <input
          id="unstake-amount"
          type="text"
          value={unstakeAmount}
          onChange={(e) => setUnstakeAmount(e.target.value)}
          placeholder="e.g. 5"
        />
      </div>
      <div className="row">
        <button disabled={!isConnected || isPending || isTxPending} onClick={handleUnstake}>
          {intent === "unstake" && (isPending || isTxPending) ? "Unstaking..." : "Unstake"}
        </button>
        <button disabled={!isConnected || isPending || isTxPending} onClick={handleClaim}>
          {intent === "claim" && (isPending || isTxPending) ? "Claiming..." : "Claim Reward"}
        </button>
      </div>
      {txHash && <p className="muted">Tx: {txHash}</p>}
      {isTxSuccess && intent === "unstake" && <p className="success">Unstake success.</p>}
      {isTxSuccess && intent === "claim" && <p className="success">Claim success.</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
