import { useEffect, useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { STAKING_POOL_ADDRESS, TOKEN_DECIMALS } from "../contracts/addresses";
import { stakingPoolAbi } from "../contracts/stakingPoolAbi";

type Props = {
  onActionSuccess: () => void;
};

export function UnstakeClaimPanel({ onActionSuccess }: Props) {
  const { isConnected, address } = useAccount();
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<"unstake" | "claim" | null>(null);
  const [handledTxHash, setHandledTxHash] = useState<string | null>(null);

  const { data: userInfo } = useReadContract({
    abi: stakingPoolAbi,
    address: STAKING_POOL_ADDRESS,
    functionName: "getUserInfo",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) }
  });

  const userStakedAmount = userInfo?.[0] ?? 0n;

  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const unstakeWei = useMemo(() => {
    try {
      if (!unstakeAmount) return 0n;
      return parseUnits(unstakeAmount, TOKEN_DECIMALS);
    } catch {
      return -1n;
    }
  }, [unstakeAmount]);

  const handleUnstake = async () => {
    setError(null);

    if (!isConnected) {
      setError("Connect wallet first.");
      return;
    }
    if (unstakeWei <= 0n) {
      setError("Enter a valid unstake amount.");
      return;
    }
    if (unstakeWei > userStakedAmount) {
      setError("Unstake amount exceeds your staked balance.");
      return;
    }

    setIntent("unstake");
    try {
      await writeContractAsync({
        abi: stakingPoolAbi,
        address: STAKING_POOL_ADDRESS,
        functionName: "unstake",
        args: [unstakeWei]
      });
    } catch (txError) {
      setIntent(null);
      setError((txError as Error).message || "Unstake failed.");
    }
  };

  const handleClaim = async () => {
    setError(null);
    if (!isConnected) {
      setError("Connect wallet first.");
      return;
    }

    setIntent("claim");
    try {
      await writeContractAsync({
        abi: stakingPoolAbi,
        address: STAKING_POOL_ADDRESS,
        functionName: "claimReward",
        args: []
      });
    } catch (txError) {
      setIntent(null);
      setError((txError as Error).message || "Claim failed.");
    }
  };

  useEffect(() => {
    if (!isTxSuccess || !intent || !txHash) return;
    if (handledTxHash === txHash) return;

    setHandledTxHash(txHash);
    onActionSuccess();
    setIntent(null);
  }, [handledTxHash, intent, isTxSuccess, onActionSuccess, txHash]);

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
