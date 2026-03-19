# staking-protocol frontend

Minimal staking dashboard for Project 2.

It connects wallet via wagmi, calls contracts via viem, and reads indexed data from backend API.

## Features

- Wallet connect/disconnect
- User position card (DB + realtime `pendingReward` from backend)
- Protocol stats card
- Stake flow with approve + stake (two-step)
- Unstake + claim actions
- User event history with pagination
- Loading / error / empty / tx pending / tx success states

## Tech Stack

- React + TypeScript
- Vite
- wagmi + viem

## Setup

```bash
cd frontend
cp .env.example .env
```

Set `.env` values:

- `VITE_CHAIN_RPC_URL`
- `VITE_STAKING_POOL_ADDRESS`
- `VITE_STAKING_TOKEN_ADDRESS`
- `VITE_TOKEN_DECIMALS`

Install and run:

```bash
npm install
npm run dev
```

## API Dependency

Frontend calls backend endpoints:

- `GET /health`
- `GET /users/:address/position`
- `GET /users/:address/events`
- `GET /protocol/stats`

`vite.config.ts` includes local proxy to backend `http://127.0.0.1:3000` for these routes.

## Contracts

Contract config lives in:

- `src/contracts/addresses.ts`
- `src/contracts/stakingPoolAbi.ts`
- `src/contracts/erc20Abi.ts`

## Notes

This is a minimal demo dashboard and intentionally avoids advanced state management and complex UI behavior.
