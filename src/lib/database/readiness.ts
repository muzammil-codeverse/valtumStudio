import "server-only";

import { logger } from "@/lib/logging";

import { prisma } from "./client";

export async function isDatabaseReady(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.warn("Database readiness check failed.", { error });
    return false;
  }
}
