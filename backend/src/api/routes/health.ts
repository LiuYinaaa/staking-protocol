import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    return {
      ok: true,
      service: "staking-protocol-backend",
      timestamp: new Date().toISOString()
    };
  });
}
