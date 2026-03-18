# staking-protocol backend

Backend service for Project 2. It is responsible for indexing `StakingPool` events and exposing query APIs.

Current stage focuses on project skeleton + database schema. Full indexing and business APIs are intentionally left as TODO.

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
        index.ts
        health.ts
        staking.ts
    services/
      stakingQueryService.ts
```

## Data Models

`prisma/schema.prisma` includes:

- `StakingEvent`
- `StakingPosition`
- `ProtocolStats`
- `SyncState`

These are enough to start event ingestion and API queries in the next stage.

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

Server default:

- `http://0.0.0.0:3000`
- Health check: `GET /health`
- API base: `GET /api/v1/staking/overview`

## Current Status

Implemented:

- Environment loading and validation
- Fastify server bootstrap and basic routes
- Prisma client wiring and initial repositories
- Indexer module skeleton (sync/checkpoint/parser)

Not implemented yet:

- Real on-chain event fetching and decoding
- Stateful aggregation updates for positions/stats
- Production-ready API validation/pagination/auth
