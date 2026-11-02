import { afterEach, describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";

import { createAuthOptions } from "./auth-options";

function options() {
  return createAuthOptions({
    baseUrl: "https://valtumstudio.com.au",
    environment: "test",
    prisma: {} as PrismaClient,
    secret: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    sessionExpiresSeconds: 3600,
    sessionUpdateAgeSeconds: 300,
    trustedOrigins: ["https://valtumstudio.com.au"],
    trustedProxyCidrs: []
  });
}

afterEach(() => vi.unstubAllEnvs());

describe("customer registration release gate", () => {
  it("is disabled until the portal, registration, and email infrastructure are ready", () => {
    vi.stubEnv("CLIENT_PORTAL_ENABLED", "false");
    vi.stubEnv("CUSTOMER_SIGNUP_ENABLED", "true");
    vi.stubEnv("RESEND_API_KEY", "test");
    vi.stubEnv("LEAD_EMAIL_FROM", "hello@mail.valtumstudio.com.au");
    expect(options().emailAndPassword.disableSignUp).toBe(true);
  });

  it("requires verified email and does not start an authenticated session on signup", () => {
    vi.stubEnv("CLIENT_PORTAL_ENABLED", "true");
    vi.stubEnv("CUSTOMER_SIGNUP_ENABLED", "true");
    vi.stubEnv("RESEND_API_KEY", "test");
    vi.stubEnv("LEAD_EMAIL_FROM", "hello@mail.valtumstudio.com.au");
    const config = options();
    expect(config.emailAndPassword.disableSignUp).toBe(false);
    expect(config.emailAndPassword.autoSignIn).toBe(false);
    expect(config.emailAndPassword.requireEmailVerification).toBe(true);
    expect(config.user.additionalFields.mustChangePassword.defaultValue).toBe(false);
  });

  it("requires a configured email sender even when both feature switches are on", () => {
    vi.stubEnv("CLIENT_PORTAL_ENABLED", "true");
    vi.stubEnv("CUSTOMER_SIGNUP_ENABLED", "true");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("LEAD_EMAIL_FROM", "");
    expect(options().emailAndPassword.disableSignUp).toBe(true);
  });
});
