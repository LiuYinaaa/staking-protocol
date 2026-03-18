import { prisma } from "./db/prisma.js";
import { startServer } from "./api/server.js";

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    await startServer();
  } catch (error) {
    console.error("Failed to start backend", error);
    process.exitCode = 1;
    await prisma.$disconnect();
  }
}

void bootstrap();
