import { getAddress, isAddress } from "viem";
import type { FastifyInstance } from "fastify";

import type { QueryApiService } from "../../services/queryApiService.js";

function parsePagination(rawLimit: unknown, rawOffset: unknown): { limit: number; offset: number } {
  const limitStr = typeof rawLimit === "string" ? rawLimit : "20";
  const offsetStr = typeof rawOffset === "string" ? rawOffset : "0";

  const limit = Number(limitStr);
  const offset = Number(offsetStr);

  if (!Number.isInteger(limit) || limit <= 0 || limit > 200) {
    throw new Error("Invalid query param: limit must be an integer between 1 and 200");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid query param: offset must be a non-negative integer");
  }

  return { limit, offset };
}

function normalizeAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error("Invalid address format");
  }
  return getAddress(address).toLowerCase();
}

export async function queryRoutes(
  app: FastifyInstance,
  opts: { queryService: QueryApiService }
): Promise<void> {
  const { queryService } = opts;

  app.get<{ Params: { address: string } }>("/users/:address/position", async (request, reply) => {
    try {
      const address = normalizeAddress(request.params.address);
      const position = await queryService.getUserPosition(address);
      return { data: position };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid request";
      return reply.code(400).send({ error: message });
    }
  });

  app.get<{ Params: { address: string }; Querystring: { limit?: string; offset?: string } }>(
    "/users/:address/events",
    async (request, reply) => {
      try {
        const address = normalizeAddress(request.params.address);
        const { limit, offset } = parsePagination(
          request.query.limit,
          request.query.offset
        );

        const events = await queryService.getUserEvents(address, limit, offset);

        return {
          data: events,
          pagination: { limit, offset, count: events.length }
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid request";
        return reply.code(400).send({ error: message });
      }
    }
  );

  app.get("/protocol/stats", async () => {
    const stats = await queryService.getProtocolStats();
    return { data: stats };
  });
}
