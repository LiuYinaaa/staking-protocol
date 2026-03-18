import Fastify, { type FastifyInstance } from "fastify";

import { env } from "../config/env.js";
import { registerRoutes } from "./routes/index.js";

export function buildServer(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.register(registerRoutes);

  return app;
}

export async function startServer(): Promise<void> {
  const app = buildServer();
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
}
