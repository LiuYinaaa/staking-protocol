# Staking Protocol (Full-Stack Web3 Demo)

A minimal but complete staking protocol demo that covers smart contracts, indexing, API, and dashboard in one project.

This repository is designed as a portfolio-style project showing how to build a small production-like Web3 system end-to-end:

- Solidity protocol logic (Foundry)
- Local deployment and scripted demo flows
- Event indexing pipeline (Node.js + viem + Prisma)
- PostgreSQL persistence layer
- Query API (Fastify)
- React dashboard (wagmi + viem)

## 1. Project Overview

`staking-protocol` implements a single-pool ERC20 staking protocol.

Users can:

- Stake tokens
- Unstake tokens
- Claim rewards

Rewards accrue linearly over time and are settled through user interactions.

This is intentionally a focused v1 demo: clear logic, testable flow, and full-stack observability, without governance or upgrade complexity.

## 2. Features

- Single pool staking with linear time-based rewards
- Reward accounting with `accRewardPerShare` + `rewardDebt` + `pendingRewards`
- Foundry unit and flow tests
- Local deployment scripts (`Deploy`, `DemoFlow`, `MultiStake`, `MultiUnstake`)
- Token faucet for local demo users
- Backend indexer for `Staked`, `Unstaked`, `RewardClaimed`
- Idempotent event ingestion with checkpoint sync
- Protocol/user query APIs
- Frontend dashboard with wallet connection and on-chain actions

## 3. System Architecture

```text
┌──────────────────┐       logs/events       ┌─────────────────────────────┐
│   StakingPool    │ ──────────────────────> │ Backend Indexer (viem)      │
│  (Solidity/EVM)  │                         │ - parse events              │
└────────┬─────────┘                         │ - update position/stats     │
         │                                    └──────────────┬──────────────┘
         │ contract write/read                               │
         ▼                                                   ▼
┌──────────────────┐                                ┌──────────────────┐
│ Frontend (React) │ <──── HTTP API (Fastify) ──── │ PostgreSQL/Prisma│
│ wagmi + viem     │                                │ events/state      │
└──────────────────┘                                └──────────────────┘
```

## 4. Smart Contract Design

Location: `contracts/src`

- `MockERC20.sol`
  - OpenZeppelin ERC20-based test token
  - Constructor params: `name`, `symbol`, `initialSupply`
- `StakingPool.sol`
  - Core pool contract
  - Uses `IERC20`, `SafeERC20`, `ReentrancyGuard`
  - Main state:
    - `stakingToken`, `rewardToken`
    - `rewardRate`
    - `totalStaked`
    - `accRewardPerShare`
    - `lastRewardTimestamp`
    - `PRECISION`
  - User state (`UserInfo`):
    - `amount`
    - `rewardDebt`
    - `pendingRewards`
  - Main functions:
    - `stake(uint256)`
    - `unstake(uint256)`
    - `claimReward()`
    - `pendingReward(address)`
    - `_updatePool()`
- `TokenFaucet.sol`
  - Local demo helper to distribute staking token with cooldown

## 5. Reward Model Explanation

Current reward model is linear per second:

- `reward = elapsed * rewardRate`
- `accRewardPerShare += reward * PRECISION / totalStaked`

When a user interacts (`stake`, `unstake`, `claimReward`):

1. Pool updates global reward state via `_updatePool()`
2. User’s newly accrued reward is moved into `pendingRewards`
3. User position (`amount`, `rewardDebt`) is updated

This ensures rewards are not lost across multiple interactions and that stake/unstake do not auto-claim by default.

## 6. Backend Architecture

Location: `backend/src`

- `blockchain/`
  - viem public client
  - staking event ABI/topic parsing helpers
- `indexer/`
  - block range scan
  - log parsing
  - checkpoint (`SyncState`) management
- `db/repositories/`
  - idempotent event insertion
  - user position upsert
  - protocol stats update
- `services/`
  - query service for API responses
- `api/`
  - Fastify server and routes

Indexer behavior:

- Scans `Staked`, `Unstaked`, `RewardClaimed`
- Writes `StakingEvent`
- Updates `StakingPosition` and `ProtocolStats`
- Uses unique key `(txHash, logIndex)` to stay idempotent

## 7. Database Schema Overview

Prisma schema: `backend/prisma/schema.prisma`

- `StakingEvent`
  - Raw normalized event records
  - Unique: `(txHash, logIndex)`
- `StakingPosition`
  - Per-user aggregate (`stakedAmount`, `totalClaimedReward`)
- `ProtocolStats`
  - Protocol-level aggregate (`totalStaked`, `totalUsers`, `totalRewardsClaimed`)
- `SyncState`
  - Per-contract checkpoint (`lastSyncedBlock`)

## 8. API Endpoints

Backend default: `http://127.0.0.1:3000`

- `GET /health`
  - Service health check
- `GET /users/:address/position`
  - DB position + real-time on-chain `pendingReward(address)`
- `GET /users/:address/events?limit=20&offset=0`
  - Paginated user staking events
- `GET /protocol/stats`
  - Protocol aggregate stats

Notes:

- Address and pagination validation are implemented (`400` on invalid input).
- API currently focuses on read/query use cases.

## 9. Frontend Dashboard

Location: `frontend/`

Stack: React + TypeScript + Vite + wagmi + viem

Modules:

- Wallet connect panel
- User position card
- Protocol stats card
- Approve + Stake flow
- Unstake / Claim actions
- Token/Faucet panel
- User event history

Vite dev server: `http://localhost:5173`  
Proxy targets backend routes to `http://127.0.0.1:3000`.

## 10. Local Development

### Prerequisites

- Node.js >= 20
- pnpm or npm
- Foundry (`forge`, `anvil`, `cast`)
- PostgreSQL

### 1) Start local chain

```bash
anvil
```

### 2) Deploy contracts

```bash
cd contracts
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <ANVIL_PRIVATE_KEY> \
  --broadcast
```

Optional faucet:

```bash
STAKING_TOKEN=<staking_token_address> \
forge script script/DeployFaucet.s.sol:DeployFaucet \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <ANVIL_PRIVATE_KEY> \
  --broadcast
```

### 3) Start backend

```bash
cd backend
cp .env.example .env
# fill DATABASE_URL, RPC_URL, STAKING_POOL_ADDRESS, START_BLOCK
pnpm install
pnpm run prisma:generate
pnpm run prisma:migrate -- --name init
pnpm run dev
```

### 4) Run indexer scan

```bash
cd backend
pnpm run indexer:scan -- <fromBlock> <toBlock>
# or incremental mode:
pnpm run indexer:scan
```

### 5) Start frontend

```bash
cd frontend
cp .env.example .env
# fill VITE_CHAIN_RPC_URL + contract addresses
pnpm install
pnpm run dev
```

## 11. Testing

Smart contracts:

```bash
cd contracts
forge test -vv
```

Backend tests:

```bash
cd backend
pnpm test
```

Frontend currently focuses on manual integration testing with local chain + backend API.

## 12. Known Limitations

- Single pool only
- No lock-up periods, penalties, or dynamic emissions
- No access control/admin management module
- No upgradeability pattern
- Indexer is batch/manual scan (no websocket realtime listener yet)
- Dashboard UX is demo-focused and not production-hardened

## 13. Future Improvements

- Realtime indexer mode (new-block subscription)
- Better tx lifecycle UX and richer error diagnostics in frontend
- Contract-level gas optimization and additional invariants
- Broader test coverage (integration/e2e)
- Multi-pool support and configurable reward programs
- Auth/rate limiting/caching for API layer
- Docker Compose for one-command local stack

---

This project is intentionally scoped as a learning-oriented full-stack protocol demo, with clear boundaries between on-chain logic, off-chain indexing, and UI integration.
