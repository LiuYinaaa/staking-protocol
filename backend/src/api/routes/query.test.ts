import test from "node:test";
import assert from "node:assert/strict";

import { buildServer } from "../server.js";
import type { QueryApiService } from "../../services/queryApiService.js";

const mockService: QueryApiService = {
  async getUserPosition(address: string) {
    return {
      userAddress: address,
      stakedAmount: "100",
      totalClaimedReward: "50",
      pendingReward: "7",
      lastUpdatedBlock: "123",
      lastUpdatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString()
    };
  },
  async getUserEvents() {
    return [
      {
        eventType: "Staked",
        amount: "100",
        txHash: "0xabc",
        blockNumber: "120",
        timestamp: new Date("2026-01-01T00:00:00.000Z").toISOString()
      }
    ];
  },
  async getProtocolStats() {
    return {
      totalStaked: "1000",
      totalUsers: 2,
      totalRewardsClaimed: "88",
      lastUpdatedBlock: "125",
      updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString()
    };
  }
};

test("GET /health returns ok", async () => {
  const app = buildServer({ queryService: mockService });
  const res = await app.inject({ method: "GET", url: "/health" });

  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.ok, true);

  await app.close();
});

test("GET /users/:address/position validates address", async () => {
  const app = buildServer({ queryService: mockService });
  const res = await app.inject({ method: "GET", url: "/users/not-an-address/position" });

  assert.equal(res.statusCode, 400);

  await app.close();
});

test("GET /users/:address/position returns merged data", async () => {
  const app = buildServer({ queryService: mockService });
  const res = await app.inject({
    method: "GET",
    url: "/users/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266/position"
  });

  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.data.userAddress, "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  assert.equal(body.data.pendingReward, "7");

  await app.close();
});

test("GET /users/:address/events validates pagination", async () => {
  const app = buildServer({ queryService: mockService });

  const res = await app.inject({
    method: "GET",
    url: "/users/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266/events?limit=-1&offset=abc"
  });

  assert.equal(res.statusCode, 400);

  await app.close();
});

test("GET /users/:address/events returns events", async () => {
  const app = buildServer({ queryService: mockService });

  const res = await app.inject({
    method: "GET",
    url: "/users/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266/events?limit=10&offset=0"
  });

  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.data.length, 1);
  assert.equal(body.pagination.limit, 10);
  assert.equal(body.pagination.offset, 0);

  await app.close();
});

test("GET /protocol/stats returns protocol summary", async () => {
  const app = buildServer({ queryService: mockService });

  const res = await app.inject({ method: "GET", url: "/protocol/stats" });

  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.data.totalStaked, "1000");
  assert.equal(body.data.totalUsers, 2);

  await app.close();
});
