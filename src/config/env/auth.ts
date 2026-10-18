import { Buffer } from "node:buffer";

import { z } from "zod";

import type { ApplicationEnvironment } from "./shared";

const requiredSecretSchema = z.string().min(43);
const positiveIntegerSchema = z.coerce.number().int().positive();
const booleanSchema = z.enum(["true", "false"]).transform((value) => value === "true");
const optionalHeaderSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim().length === 0 ? undefined : value,
  z.string().trim().min(1).optional()
);

export type AuthEnvironment = Readonly<{
  absoluteSessionMaxAgeSeconds: number;
  baseUrl: string;
  bootstrapEnabled: boolean;
  failedLoginLockSeconds: number;
  failedLoginMaxAttempts: number;
  failedLoginWindowSeconds: number;
  identifierHashKey: string;
  ipAddressHeader?: string | undefined;
  secret: string;
  sessionExpiresSeconds: number;
  sessionUpdateAgeSeconds: number;
  trustedOrigins: readonly string[];
  trustedProxyCidrs: readonly string[];
}>;

function assertHighEntropySecret(value: string, field: string): string {
  const decoded = Buffer.from(value, "base64url");
  if (decoded.byteLength < 32) {
    throw new Error(`${field} must contain at least 32 high-entropy bytes.`);
  }

  return value;
}

function parseTrustedOrigins(
  value: string,
  environment: ApplicationEnvironment
): readonly string[] {
  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => {
      if (origin.includes("*")) {
        throw new Error("AUTH_TRUSTED_ORIGINS must not contain wildcard origins.");
      }

      const parsed = new URL(origin);
      if (parsed.origin !== origin || !["http:", "https:"].includes(parsed.protocol)) {
        throw new Error(
          "AUTH_TRUSTED_ORIGINS entries must be absolute origins without paths."
        );
      }
      if (environment === "production" && parsed.protocol !== "https:") {
        throw new Error("AUTH_TRUSTED_ORIGINS must use HTTPS in production.");
      }
      return parsed.origin;
    });

  if (origins.length === 0) {
    throw new Error("AUTH_TRUSTED_ORIGINS must include at least one trusted origin.");
  }

  return Object.freeze([...new Set(origins)]);
}

export function parseAuthEnvironment(
  input: Readonly<Record<string, string | undefined>>,
  applicationEnvironment: ApplicationEnvironment,
  applicationBaseUrl: string
): AuthEnvironment {
  const result = z
    .object({
      AUTH_ABSOLUTE_SESSION_MAX_AGE_SECONDS: positiveIntegerSchema,
      AUTH_BOOTSTRAP_ENABLED: booleanSchema,
      AUTH_FAILED_LOGIN_LOCK_SECONDS: positiveIntegerSchema,
      AUTH_FAILED_LOGIN_MAX_ATTEMPTS: positiveIntegerSchema,
      AUTH_FAILED_LOGIN_WINDOW_SECONDS: positiveIntegerSchema,
      AUTH_IDENTIFIER_HASH_KEY: requiredSecretSchema,
      AUTH_IP_ADDRESS_HEADER: optionalHeaderSchema,
      AUTH_SESSION_EXPIRES_SECONDS: positiveIntegerSchema,
      AUTH_SESSION_UPDATE_AGE_SECONDS: positiveIntegerSchema,
      AUTH_TRUSTED_ORIGINS: z.string(),
      AUTH_TRUSTED_PROXY_CIDRS: z.string().optional(),
      BETTER_AUTH_SECRET: requiredSecretSchema,
      BETTER_AUTH_URL: z.url()
    })
    .safeParse(input);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid authentication environment configuration. ${issues}`);
  }

  const baseUrl = new URL(result.data.BETTER_AUTH_URL);
  if (baseUrl.origin !== result.data.BETTER_AUTH_URL.replace(/\/$/, "")) {
    throw new Error("BETTER_AUTH_URL must be an absolute origin without a path.");
  }
  if (applicationEnvironment === "production" && baseUrl.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL must use HTTPS in production.");
  }
  if (new URL(applicationBaseUrl).origin !== baseUrl.origin) {
    throw new Error("BETTER_AUTH_URL must match APP_BASE_URL's origin.");
  }

  const trustedOrigins = parseTrustedOrigins(
    result.data.AUTH_TRUSTED_ORIGINS,
    applicationEnvironment
  );
  if (!trustedOrigins.includes(baseUrl.origin)) {
    throw new Error("AUTH_TRUSTED_ORIGINS must include BETTER_AUTH_URL.");
  }

  const trustedProxyCidrs = Object.freeze(
    (result.data.AUTH_TRUSTED_PROXY_CIDRS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  );

  if (
    applicationEnvironment === "production" &&
    result.data.AUTH_IP_ADDRESS_HEADER !== undefined &&
    trustedProxyCidrs.length === 0
  ) {
    throw new Error(
      "AUTH_TRUSTED_PROXY_CIDRS is required in production when AUTH_IP_ADDRESS_HEADER is configured."
    );
  }

  return Object.freeze({
    absoluteSessionMaxAgeSeconds: result.data.AUTH_ABSOLUTE_SESSION_MAX_AGE_SECONDS,
    baseUrl: baseUrl.origin,
    bootstrapEnabled: result.data.AUTH_BOOTSTRAP_ENABLED,
    failedLoginLockSeconds: result.data.AUTH_FAILED_LOGIN_LOCK_SECONDS,
    failedLoginMaxAttempts: result.data.AUTH_FAILED_LOGIN_MAX_ATTEMPTS,
    failedLoginWindowSeconds: result.data.AUTH_FAILED_LOGIN_WINDOW_SECONDS,
    identifierHashKey: assertHighEntropySecret(
      result.data.AUTH_IDENTIFIER_HASH_KEY,
      "AUTH_IDENTIFIER_HASH_KEY"
    ),
    ipAddressHeader: result.data.AUTH_IP_ADDRESS_HEADER,
    secret: assertHighEntropySecret(
      result.data.BETTER_AUTH_SECRET,
      "BETTER_AUTH_SECRET"
    ),
    sessionExpiresSeconds: result.data.AUTH_SESSION_EXPIRES_SECONDS,
    sessionUpdateAgeSeconds: result.data.AUTH_SESSION_UPDATE_AGE_SECONDS,
    trustedOrigins,
    trustedProxyCidrs
  });
}
