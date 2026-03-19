import { useEffect, useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { STAKING_POOL_ADDRESS, STAKING_TOKEN_ADDRESS, TOKEN_DECIMALS } from "../contracts/addresses";
import { erc20Abi } from "../contracts/erc20Abi";
import { stakingPoolAbi } from "../contracts/stakingPoolAbi";

type Props = {
  onActionSuccess: () => void;
};

export function StakeForm({ onActionSuccess }: Props) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<"approve" | "stake" | null>(null);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: STAKING_TOKEN_ADDRESS,
    functionName: "allowance",
    args: address ? [address, STAKING_POOL_ADDRESS] : undefined,
    query: {
      enabled: Boolean(address)
    }
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const amountWei = useMemo(() => {
    try {
      if (!amount) return 0n;
      return parseUnits(amount, TOKEN_DECIMALS);
    } catch {
      return -1n;
    }
  }, [amount]);

  const handleSubmit = () => {
    setError(null);

    if (!isConnected || !address) {
      setError("Connect wallet first.");
      return;
    }
    if (amountWei <= 0n) {
      setError("Enter a valid amount.");
      return;
    }

    const currentAllowance = allowance ?? 0n;

    if (currentAllowance < amountWei) {
      setIntent("approve");
      writeContract({
        abi: erc20Abi,
        address: STAKING_TOKEN_ADDRESS,
        functionName: "approve",
        args: [STAKING_POOL_ADDRESS, amountWei]
      });
      return;
    }

    setIntent("stake");
    writeContract({
      abi: stakingPoolAbi,
      address: STAKING_POOL_ADDRESS,
      functionName: "stake",
      args: [amountWei]
    });
  };

  useEffect(() => {
    if (!isTxSuccess || !intent) return;

    if (intent === "stake") {
      onActionSuccess();
    } else if (intent === "approve") {
      void refetchAllowance();
    }
  }, [intent, isTxSuccess, onActionSuccess, refetchAllowance]);

  return (
    <section className="card">
      <h2>Stake</h2>
      <div className="field">
        <label htmlFor="stake-amount">Amount</label>
        <input
          id="stake-amount"
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 10"
        />
      </div>
      <button disabled={!isConnected || isPending || isTxPending} onClick={handleSubmit}>
        {isPending || isTxPending
          ? "Submitting..."
          : allowance !== undefined && amountWei > 0n && allowance < amountWei
            ? "Approve"
            : "Stake"}
      </button>
      {txHash && <p className="muted">Tx: {txHash}</p>}
      {isTxSuccess && intent === "approve" && (
        <p className="success">Approve confirmed. Click Stake to continue.</p>
      )}
      {isTxSuccess && intent === "stake" && <p className="success">Stake success.</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
