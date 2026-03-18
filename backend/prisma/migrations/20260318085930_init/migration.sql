-- CreateTable
CREATE TABLE "StakingEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userAddress" VARCHAR(42) NOT NULL,
    "amount" DECIMAL(78,0) NOT NULL,
    "txHash" VARCHAR(66) NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StakingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakingPosition" (
    "id" TEXT NOT NULL,
    "userAddress" VARCHAR(42) NOT NULL,
    "stakedAmount" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "totalClaimedReward" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "lastUpdatedBlock" BIGINT NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StakingPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolStats" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "totalStaked" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "totalRewardsClaimed" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "lastUpdatedBlock" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtocolStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL,
    "contractAddress" VARCHAR(42) NOT NULL,
    "lastSyncedBlock" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StakingEvent_userAddress_blockNumber_idx" ON "StakingEvent"("userAddress", "blockNumber");

-- CreateIndex
CREATE INDEX "StakingEvent_eventType_blockNumber_idx" ON "StakingEvent"("eventType", "blockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StakingEvent_txHash_logIndex_key" ON "StakingEvent"("txHash", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "StakingPosition_userAddress_key" ON "StakingPosition"("userAddress");

-- CreateIndex
CREATE UNIQUE INDEX "SyncState_contractAddress_key" ON "SyncState"("contractAddress");
