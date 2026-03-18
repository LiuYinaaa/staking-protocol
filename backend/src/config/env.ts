import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getNumberEnv(name: string, fallback?: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required numeric env var: ${name}`);
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid numeric env var: ${name}=${raw}`);
  }

  return value;
}

export const env = {
  DATABASE_URL: getEnv("DATABASE_URL"),
  RPC_URL: getEnv("RPC_URL"),
  STAKING_POOL_ADDRESS: getEnv("STAKING_POOL_ADDRESS"),
  START_BLOCK: BigInt(getNumberEnv("START_BLOCK", 0)),
  API_HOST: process.env.API_HOST ?? "0.0.0.0",
  API_PORT: getNumberEnv("API_PORT", 3000)
} as const;
