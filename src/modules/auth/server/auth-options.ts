import type { BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, twoFactor } from "better-auth/plugins";

import type { ApplicationEnvironment } from "@/config/env/shared";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  pluginAccessControl,
  pluginRoles
} from "@/modules/auth/policies/plugin-access";

type AuthOptionInput = Readonly<{
  baseUrl: string;
  environment: ApplicationEnvironment;
  ipAddressHeader?: string | undefined;
  prisma: PrismaClient;
  secret: string;
  sessionExpiresSeconds: number;
  sessionUpdateAgeSeconds: number;
  trustedOrigins: readonly string[];
  trustedProxyCidrs: readonly string[];
}>;

/**
 * The source of truth for the Better Auth schema and runtime configuration.
 * This module intentionally has no `server-only` marker because the Better Auth
 * schema CLI imports it; runtime imports remain protected by auth.ts.
 */
export function createAuthOptions(input: AuthOptionInput) {
  return {
    advanced: {
      cookiePrefix: "siglum",
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: input.environment === "production"
      },
      ipAddress: input.ipAddressHeader
        ? {
            ipAddressHeaders: [input.ipAddressHeader],
            trustedProxies: [...input.trustedProxyCidrs]
          }
        : undefined,
      useSecureCookies: input.environment === "production"
    },
    appName: "Siglum Studio",
    basePath: "/api/auth",
    baseURL: input.baseUrl,
    database: prismaAdapter(input.prisma, { provider: "postgresql" }),
    emailAndPassword: {
      autoSignIn: true,
      disableSignUp: true,
      enabled: true,
      maxPasswordLength: 128,
      minPasswordLength: 14
    },
    plugins: [
      twoFactor({ issuer: "Siglum Studio", skipVerificationOnEnable: false }),
      admin({ ac: pluginAccessControl, defaultRole: "editor", roles: pluginRoles })
    ],
    rateLimit: {
      customRules: {
        "/change-password": { max: 5, window: 60 },
        "/sign-in/email": { max: 5, window: 60 },
        "/two-factor/verify-backup-code": { max: 5, window: 60 },
        "/two-factor/verify-totp": { max: 5, window: 60 }
      },
      enabled: true,
      max: 100,
      storage: "database",
      window: 60
    },
    secret: input.secret,
    session: {
      cookieCache: { enabled: false },
      expiresIn: input.sessionExpiresSeconds,
      updateAge: input.sessionUpdateAgeSeconds
    },
    trustedOrigins: [...input.trustedOrigins],
    user: {
      additionalFields: {
        lastPasswordChangedAt: { input: false, required: false, type: "date" },
        lastSuccessfulLoginAt: { input: false, required: false, type: "date" },
        mustChangePassword: {
          defaultValue: true,
          input: false,
          required: false,
          type: "boolean"
        }
      }
    }
  } satisfies BetterAuthOptions;
}
