import type { FastifyInstance } from "fastify";

import { createQueryApiService, type QueryApiService } from "../../services/queryApiService.js";
import { healthRoutes } from "./health.js";
import { queryRoutes } from "./query.js";

export type RouteDependencies = {
  queryService?: QueryApiService;
};

export async function registerRoutes(
  app: FastifyInstance,
  deps: RouteDependencies = {}
): Promise<void> {
  const queryService = deps.queryService ?? createQueryApiService();

  await app.register(healthRoutes);
  await app.register(queryRoutes, { queryService });
}
