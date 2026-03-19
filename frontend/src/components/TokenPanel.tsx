import { useEffect, useMemo, useState } from "react";
import type { BaseError, Hash } from "viem";
import { formatUnits } from "viem";
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import {
  FAUCET_ADDRESS,
  REWARD_TOKEN_ADDRESS,
  STAKING_TOKEN_ADDRESS,
  TOKEN_DECIMALS
} from "../contracts/addresses";
import { erc20Abi } from "../contracts/erc20Abi";
import { faucetAbi } from "../contracts/faucetAbi";

type Props = {
  refreshKey: number;
  onActionSuccess: () => void;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function TokenPanel({ refreshKey, onActionSuccess }: Props) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState<string | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<Hash | undefined>();

  const faucetEnabled = FAUCET_ADDRESS.toLowerCase() !== ZERO_ADDRESS;

  const { data: stakingBalance, refetch: refetchStakingBalance } = useReadContract({
    abi: erc20Abi,
    address: STAKING_TOKEN_ADDRESS,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) }
  });

  const { data: rewardBalance, refetch: refetchRewardBalance } = useReadContract({
    abi: erc20Abi,
    address: REWARD_TOKEN_ADDRESS,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) }
  });

  const { data: dripAmount } = useReadContract({
    abi: faucetAbi,
    address: FAUCET_ADDRESS,
    functionName: "dripAmount",
    query: { enabled: faucetEnabled }
  });

  const { data: claimCooldown } = useReadContract({
    abi: faucetAbi,
    address: FAUCET_ADDRESS,
    functionName: "claimCooldown",
    query: { enabled: faucetEnabled }
  });

  const { data: nextClaimTs, refetch: refetchNextClaimTs } = useReadContract({
    abi: faucetAbi,
    address: FAUCET_ADDRESS,
    functionName: "nextClaimTimestamp",
    args: address ? [address] : undefined,
    query: { enabled: faucetEnabled && Boolean(address) }
  });

  const { writeContractAsync, isPending, error: writeError } = useWriteContract();
  const {
    isLoading: isTxPending,
    isSuccess: isTxSuccess,
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash: claimTxHash,
    query: {
      enabled: Boolean(claimTxHash),
      // Prevent indefinite loading if receipt cannot be found on configured RPC.
      retry: 20,
      retryDelay: 1000
    }
  });

  useEffect(() => {
    if (!address) return;
    void refetchStakingBalance();
    void refetchRewardBalance();
    if (faucetEnabled) {
      void refetchNextClaimTs();
    }
  }, [
    address,
    faucetEnabled,
    refreshKey,
    refetchNextClaimTs,
    refetchRewardBalance,
    refetchStakingBalance
  ]);

  useEffect(() => {
    if (!isTxSuccess) return;
    setClaimTxHash(undefined);
    onActionSuccess();
  }, [isTxSuccess, onActionSuccess]);

  useEffect(() => {
    if (!writeError) return;
    setError((writeError as BaseError).shortMessage ?? "Failed to send claim transaction.");
  }, [writeError]);

  useEffect(() => {
    if (!receiptError) return;
    setError(
      (receiptError as BaseError).shortMessage ??
        "Transaction receipt not found. Check wallet RPC and retry."
    );
  }, [receiptError]);

  const claimBlocked = useMemo(() => {
    if (!nextClaimTs || nextClaimTs === 0n) return false;
    const now = BigInt(Math.floor(Date.now() / 1000));
    return nextClaimTs > now;
  }, [nextClaimTs]);

  const nextClaimText = useMemo(() => {
    if (!nextClaimTs || nextClaimTs === 0n) return "Available now";
    const date = new Date(Number(nextClaimTs) * 1000);
    return date.toLocaleString();
  }, [nextClaimTs]);

  const handleFaucetClaim = async () => {
    setError(null);

    if (!isConnected || !address) {
      setError("Connect wallet first.");
      return;
    }

    if (!faucetEnabled) {
      setError("Faucet address is not configured.");
      return;
    }

    if (chainId !== 31_337) {
      setError("Wrong network. Please switch wallet to Anvil (chainId 31337).");
      return;
    }

    try {
      const hash = await Promise.race([
        writeContractAsync({
          abi: faucetAbi,
          address: FAUCET_ADDRESS,
          functionName: "claim",
          args: []
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Wallet confirmation timeout. Please retry in MetaMask.")),
            30000
          )
        )
      ]);
      setClaimTxHash(hash);
    } catch (txError) {
      setError((txError as BaseError).shortMessage ?? "Claim transaction rejected.");
    }
  };

  const handleResetClaimState = () => {
    setClaimTxHash(undefined);
    setError(null);
  };

  return (
    <section className="card">
      <h2>Token Balances & Faucet</h2>
      {!isConnected && <p className="muted">Connect wallet to view token balances.</p>}
      {isConnected && (
        <>
          <div className="grid-2">
            <div className="metric">
              <span>Staking Token Balance</span>
              <strong>{formatUnits(stakingBalance ?? 0n, TOKEN_DECIMALS)}</strong>
            </div>
            <div className="metric">
              <span>Reward Token Balance</span>
              <strong>{formatUnits(rewardBalance ?? 0n, TOKEN_DECIMALS)}</strong>
            </div>
          </div>

          {faucetEnabled ? (
            <>
              <div className="grid-2" style={{ marginTop: 12 }}>
                <div className="metric">
                  <span>Faucet Drip Amount</span>
                  <strong>{formatUnits(dripAmount ?? 0n, TOKEN_DECIMALS)}</strong>
                </div>
                <div className="metric">
                  <span>Faucet Cooldown (sec)</span>
                  <strong>{(claimCooldown ?? 0n).toString()}</strong>
                </div>
                <div className="metric">
                  <span>Next Claim Time</span>
                  <strong>{nextClaimText}</strong>
                </div>
              </div>

              <button
                style={{ marginTop: 12 }}
                disabled={!isConnected || isPending || isTxPending || claimBlocked}
                onClick={handleFaucetClaim}
              >
                {isPending || isTxPending ? "Claiming..." : "Claim Faucet"}
              </button>
              {(isPending || isTxPending || error) && (
                <button style={{ marginTop: 8, marginLeft: 8 }} onClick={handleResetClaimState}>
                  Reset Claim State
                </button>
              )}
              {claimBlocked && <p className="muted">Claim is cooling down.</p>}
            </>
          ) : (
            <p className="muted" style={{ marginTop: 12 }}>
              Faucet is not configured. Set `VITE_FAUCET_ADDRESS` in frontend `.env`.
            </p>
          )}

          {claimTxHash && <p className="muted">Tx: {claimTxHash}</p>}
          {isTxSuccess && <p className="success">Faucet claim success.</p>}
          {error && <p className="error">{error}</p>}
        </>
      )}
    </section>
  );
}
