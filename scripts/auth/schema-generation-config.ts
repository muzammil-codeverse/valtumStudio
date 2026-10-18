import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";

import { PrismaClient } from "@/generated/prisma/client";
import { createAuthOptions } from "@/modules/auth/server/auth-options";

const connectionString =
  process.env["TEST_DATABASE_URL"] ??
  process.env["DATABASE_URL"] ??
  "postgresql://schema:schema@127.0.0.1:5432/schema";
export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const baseUrl = process.env["BETTER_AUTH_URL"] || "http://localhost:3000";

export const auth = betterAuth(
  createAuthOptions({
    baseUrl,
    environment: "test",
    prisma,
    secret:
      process.env["BETTER_AUTH_SECRET"] ||
      "schema-generation-only-secret-with-at-least-32-bytes",
    sessionExpiresSeconds: 43_200,
    sessionUpdateAgeSeconds: 3_600,
    trustedOrigins: [baseUrl],
    trustedProxyCidrs: []
  })
);
