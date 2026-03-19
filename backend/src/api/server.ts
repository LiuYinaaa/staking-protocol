import Fastify, { type FastifyInstance } from "fastify";

import { env } from "../config/env.js";
import { registerRoutes, type RouteDependencies } from "./routes/index.js";

export function buildServer(deps: RouteDependencies = {}): FastifyInstance {
  const app = Fastify({ logger: true });

  app.register(registerRoutes, deps);

  return app;
}

export async function startServer(): Promise<void> {
  const app = buildServer();
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
}
