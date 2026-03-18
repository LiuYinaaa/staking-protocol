import { createPublicClient, http } from "viem";

import { env } from "../config/env.js";

export const publicClient = createPublicClient({
  transport: http(env.RPC_URL)
});
