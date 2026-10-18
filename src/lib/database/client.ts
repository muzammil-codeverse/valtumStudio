import "server-only";

import { env } from "@/config/env/server";

import { createPrismaClient } from "./create-client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient(env.DATABASE_URL);

if (env.APP_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
