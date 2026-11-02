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
    appName: "Valtum Studio",
    basePath: "/api/auth",
    baseURL: input.baseUrl,
    database: prismaAdapter(input.prisma, { provider: "postgresql" }),
    emailAndPassword: {
      autoSignIn: false,
      customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
        ...coreFields,
        twoFactorEnabled: false,
        role: "client",
        banned: false,
        banReason: null,
        banExpires: null,
        ...additionalFields,
        id
      }),
      disableSignUp:
        process.env["CLIENT_PORTAL_ENABLED"] !== "true" ||
        process.env["CUSTOMER_SIGNUP_ENABLED"] !== "true" ||
        !process.env["RESEND_API_KEY"] ||
        !process.env["LEAD_EMAIL_FROM"],
      enabled: true,
      requireEmailVerification: true,
      maxPasswordLength: 128,
      minPasswordLength: 14
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        const apiKey = process.env["RESEND_API_KEY"];
        const sender = process.env["LEAD_EMAIL_FROM"];
        if (!apiKey || !sender) {
          throw new Error("Customer verification email delivery is not configured.");
        }
        const verifiedUrl = new URL(url);
        const allowedOrigins = new Set(input.trustedOrigins);
        allowedOrigins.add(new URL(input.baseUrl).origin);
        if (!allowedOrigins.has(verifiedUrl.origin)) {
          throw new Error("Invalid verification link destination.");
        }
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: sender,
            to: [user.email],
            subject: "Verify your Valtum Studio account",
            text:
              "Verify your email to activate your Valtum Studio customer account.\n\n" +
              verifiedUrl.toString() +
              "\n\nIf you didn't request this, you can ignore this email."
          }),
          signal: AbortSignal.timeout(12000)
        });
        if (!response.ok) {
          throw new Error("Customer verification email could not be sent.");
        }
      }
    },
    plugins: [
      twoFactor({ issuer: "Valtum Studio", skipVerificationOnEnable: false }),
      admin({ ac: pluginAccessControl, defaultRole: "client", roles: pluginRoles })
    ],
    rateLimit: {
      customRules: {
        "/change-password": { max: 5, window: 60 },
        "/sign-in/email": { max: 5, window: 60 },
        "/sign-up/email": { max: 3, window: 3600 },
        "/send-verification-email": { max: 3, window: 3600 },
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
          defaultValue: false,
          input: false,
          required: false,
          type: "boolean"
        }
      }
    }
  } satisfies BetterAuthOptions;
}
