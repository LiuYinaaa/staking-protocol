# staking-protocol backend

Backend service for Project 2. It indexes `StakingPool` events and provides query APIs for dashboard use.

Current scope:

- Event indexer for `Staked` / `Unstaked` / `RewardClaimed`
- Postgres persistence via Prisma
- Query APIs for user position, user events, and protocol stats

## Tech Stack

- Node.js + TypeScript
- Fastify
- Prisma
- PostgreSQL
- viem
- dotenv

## Directory Layout

```text
backend/
  package.json
  tsconfig.json
  .env.example
  prisma/
    schema.prisma
  src/
    main.ts
    config/
      env.ts
    blockchain/
      client.ts
      stakingPool.ts
    indexer/
      syncer.ts
      parser.ts
      checkpoint.ts
    db/
      prisma.ts
      repositories/
        stakingEventRepository.ts
        stakingPositionRepository.ts
        protocolStatsRepository.ts
        syncStateRepository.ts
    api/
      server.ts
      routes/
        health.ts
        query.ts
        index.ts
        query.test.ts
    services/
      queryApiService.ts
    scripts/
      indexStakingEvents.ts
```

## Data Models

`prisma/schema.prisma` includes:

- `StakingEvent`
- `StakingPosition`
- `ProtocolStats`
- `SyncState`

## Quick Start

1. Install dependencies

```bash
cd backend
npm install
```

2. Configure environment

```bash
cp .env.example .env
# edit DATABASE_URL, RPC_URL, STAKING_POOL_ADDRESS, START_BLOCK
```

3. Prepare Prisma client and DB schema

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

4. Run backend

```bash
npm run dev
```

## API Endpoints (v1)

### `GET /health`

Basic service health check.

### `GET /users/:address/position`

Returns merged user position:

- DB fields: `userAddress`, `stakedAmount`, `totalClaimedReward`, `lastUpdatedBlock`, `lastUpdatedAt`
- Chain field: `pendingReward(address)` (real-time read)

### `GET /users/:address/events?limit=20&offset=0`

Returns paginated staking event history for a user:

- `eventType`
- `amount`
- `txHash`
- `blockNumber`
- `timestamp`

Validation:

- invalid `address` -> `400`
- invalid `limit`/`offset` -> `400`

### `GET /protocol/stats`

Returns protocol aggregate stats from DB:

- `totalStaked`
- `totalUsers`
- `totalRewardsClaimed`
- `lastUpdatedBlock`
- `updatedAt`

## Indexer Script

Manual range scan:

```bash
npm run indexer:scan -- <fromBlock> <toBlock>
```

Incremental scan (if args are omitted):

- `fromBlock = lastSyncedBlock + 1` (or `START_BLOCK` on first run)
- `toBlock = latestBlock`

## Tests

Run API route tests:

```bash
npm test
```
