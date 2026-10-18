import "server-only";

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { authEnv, env } from "@/config/env/server";
import { prisma } from "@/lib/database";

import { createAuthOptions } from "./auth-options";

const options = createAuthOptions({
  baseUrl: authEnv.baseUrl,
  environment: env.APP_ENV,
  ipAddressHeader: authEnv.ipAddressHeader,
  prisma,
  secret: authEnv.secret,
  sessionExpiresSeconds: authEnv.sessionExpiresSeconds,
  sessionUpdateAgeSeconds: authEnv.sessionUpdateAgeSeconds,
  trustedOrigins: authEnv.trustedOrigins,
  trustedProxyCidrs: authEnv.trustedProxyCidrs
});

export const auth = betterAuth({
  ...options,
  plugins: [...options.plugins, nextCookies()]
});
