#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  ./script/query_state.sh <user> <staking_token> <reward_token> <pool> [rpc_url]

Example:
  ./script/query_state.sh \
    0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
    0x5FbDB2315678afecb367f032d93F642f64180aa3 \
    0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
    0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 \
    http://127.0.0.1:8545
USAGE
}

if [[ $# -lt 4 || $# -gt 5 ]]; then
  usage
  exit 1
fi

USER_ADDR="$1"
STAKING_TOKEN="$2"
REWARD_TOKEN="$3"
POOL_ADDR="$4"
RPC_URL="${5:-http://127.0.0.1:8545}"

check_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1"
    exit 1
  fi
}

check_cmd cast

print_token_info() {
  local name="$1"
  local token="$2"
  local user="$3"
  local rpc="$4"

  local symbol decimals raw
  symbol=$(cast call "$token" "symbol()(string)" --rpc-url "$rpc")
  decimals=$(cast call "$token" "decimals()(uint8)" --rpc-url "$rpc")
  raw=$(cast call "$token" "balanceOf(address)(uint256)" "$user" --rpc-url "$rpc")

  echo "[$name]"
  echo "  address:  $token"
  echo "  symbol:   $symbol"
  echo "  decimals: $decimals"
  echo "  balance:  $raw"
}

echo "=== Query State ==="
echo "rpc:   $RPC_URL"
echo "user:  $USER_ADDR"
echo "pool:  $POOL_ADDR"
echo

echo "[Native ETH]"
cast balance "$USER_ADDR" --rpc-url "$RPC_URL"
echo

print_token_info "Staking Token" "$STAKING_TOKEN" "$USER_ADDR" "$RPC_URL"
echo
print_token_info "Reward Token" "$REWARD_TOKEN" "$USER_ADDR" "$RPC_URL"
echo

echo "[Pool]"
echo "  totalStaked:"
cast call "$POOL_ADDR" "totalStaked()(uint256)" --rpc-url "$RPC_URL"
echo "  rewardRate:"
cast call "$POOL_ADDR" "rewardRate()(uint256)" --rpc-url "$RPC_URL"
echo "  userInfo(amount,rewardDebt,pendingRewards):"
cast call "$POOL_ADDR" "getUserInfo(address)(uint256,uint256,uint256)" "$USER_ADDR" --rpc-url "$RPC_URL"
echo "  pendingReward(user):"
cast call "$POOL_ADDR" "pendingReward(address)(uint256)" "$USER_ADDR" --rpc-url "$RPC_URL"
