import type { FastifyInstance } from "fastify";

import { healthRoutes } from "./health.js";
import { stakingRoutes } from "./staking.js";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);
  await app.register(stakingRoutes, { prefix: "/api/v1" });
}
