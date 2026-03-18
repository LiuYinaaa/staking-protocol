import type { FastifyInstance } from "fastify";

import { getOverview, getUserPosition } from "../../services/stakingQueryService.js";

export async function stakingRoutes(app: FastifyInstance): Promise<void> {
  app.get("/staking/overview", async () => {
    // TODO: pagination and richer aggregates.
    return getOverview();
  });

  app.get<{ Params: { userAddress: string } }>("/staking/positions/:userAddress", async (request) => {
    const position = await getUserPosition(request.params.userAddress);
    return { position };
  });
}
