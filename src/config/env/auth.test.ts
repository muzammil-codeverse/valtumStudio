import { Buffer } from "node:buffer";

import { describe, expect, it } from "vitest";

import { parseAuthEnvironment } from "./auth";

const secret = Buffer.alloc(32, 9).toString("base64url");
const baseEnvironment = {
  AUTH_ABSOLUTE_SESSION_MAX_AGE_SECONDS: "604800",
  AUTH_BOOTSTRAP_ENABLED: "false",
  AUTH_FAILED_LOGIN_LOCK_SECONDS: "900",
  AUTH_FAILED_LOGIN_MAX_ATTEMPTS: "10",
  AUTH_FAILED_LOGIN_WINDOW_SECONDS: "900",
  AUTH_IDENTIFIER_HASH_KEY: secret,
  AUTH_SESSION_EXPIRES_SECONDS: "43200",
  AUTH_SESSION_UPDATE_AGE_SECONDS: "3600",
  AUTH_TRUSTED_ORIGINS: "http://localhost:3000",
  BETTER_AUTH_SECRET: secret,
  BETTER_AUTH_URL: "http://localhost:3000"
};

describe("authentication environment", () => {
  it("normalizes trusted origins and validates high-entropy secret material", () => {
    const parsed = parseAuthEnvironment(
      baseEnvironment,
      "local",
      "http://localhost:3000"
    );
    expect(parsed.trustedOrigins).toEqual(["http://localhost:3000"]);
    expect(parsed.bootstrapEnabled).toBe(false);
    expect(
      parseAuthEnvironment(
        { ...baseEnvironment, AUTH_IP_ADDRESS_HEADER: "" },
        "local",
        "http://localhost:3000"
      ).ipAddressHeader
    ).toBeUndefined();
  });

  it("rejects wildcards, weak secrets, and production proxy ambiguity", () => {
    expect(() =>
      parseAuthEnvironment(
        {
          ...baseEnvironment,
          AUTH_TRUSTED_ORIGINS: "https://*.example.test",
          BETTER_AUTH_URL: "https://app.example.test"
        },
        "production",
        "https://app.example.test"
      )
    ).toThrow("wildcard");
    expect(() =>
      parseAuthEnvironment(
        { ...baseEnvironment, BETTER_AUTH_SECRET: "short" },
        "local",
        "http://localhost:3000"
      )
    ).toThrow("Invalid authentication");
    expect(() =>
      parseAuthEnvironment(
        {
          ...baseEnvironment,
          AUTH_IP_ADDRESS_HEADER: "x-forwarded-for",
          AUTH_TRUSTED_ORIGINS: "https://app.example.test",
          BETTER_AUTH_URL: "https://app.example.test"
        },
        "production",
        "https://app.example.test"
      )
    ).toThrow("TRUSTED_PROXY_CIDRS");
  });
});
