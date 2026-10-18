import "server-only";

import { z } from "zod";

const maximumUploadBytes = 15 * 1024 * 1024;
const maximumDimension = 10_000;
const maximumPixels = 50_000_000;
const maximumTtlSeconds = 900;

const enabledSchema = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const requiredBooleanSchema = z
  .enum(["true", "false"])
  .default("true")
  .transform((value) => value === "true");

const positiveInteger = (maximum: number, label: string) =>
  z.coerce.number().int().min(1).max(maximum, `${label} exceeds the supported limit.`);

const disabledEnvironmentSchema = z.object({
  MEDIA_STORAGE_ENABLED: enabledSchema
});

const enabledEnvironmentSchema = z.object({
  MEDIA_KEY_PREFIX: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,32}$/)
    .default("siglum"),
  MEDIA_MAX_IMAGE_BYTES: positiveInteger(
    maximumUploadBytes,
    "Maximum image size"
  ).default(maximumUploadBytes),
  MEDIA_MAX_IMAGE_HEIGHT: positiveInteger(
    maximumDimension,
    "Maximum image height"
  ).default(maximumDimension),
  MEDIA_MAX_IMAGE_PIXELS: positiveInteger(
    maximumPixels,
    "Maximum image pixels"
  ).default(maximumPixels),
  MEDIA_MAX_IMAGE_WIDTH: positiveInteger(
    maximumDimension,
    "Maximum image width"
  ).default(maximumDimension),
  MEDIA_PUBLIC_BASE_URL: z.url().optional(),
  MEDIA_READ_URL_TTL_SECONDS: positiveInteger(
    maximumTtlSeconds,
    "Read URL TTL"
  ).default(300),
  MEDIA_REQUIRE_SHA256_CHECKSUM: requiredBooleanSchema,
  MEDIA_S3_ACCESS_KEY_ID: z.string().trim().min(1),
  MEDIA_S3_BUCKET: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/),
  MEDIA_S3_ENDPOINT: z.url(),
  MEDIA_S3_FORCE_PATH_STYLE: enabledSchema,
  MEDIA_S3_REGION: z.string().trim().min(1).max(64),
  MEDIA_S3_SECRET_ACCESS_KEY: z.string().trim().min(1),
  MEDIA_STORAGE_ENABLED: z.literal("true"),
  MEDIA_UPLOAD_URL_TTL_SECONDS: positiveInteger(
    maximumTtlSeconds,
    "Upload URL TTL"
  ).default(300)
});

export type DisabledMediaEnvironment = Readonly<{ enabled: false }>;
export type EnabledMediaEnvironment = Readonly<
  Omit<z.output<typeof enabledEnvironmentSchema>, "MEDIA_STORAGE_ENABLED"> & {
    enabled: true;
  }
>;
export type MediaEnvironment = DisabledMediaEnvironment | EnabledMediaEnvironment;

function normalizePublicBaseUrl(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("MEDIA_PUBLIC_BASE_URL must use http or https.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "MEDIA_PUBLIC_BASE_URL must not include credentials, search, or hash."
    );
  }

  return url.toString().replace(/\/+$/, "");
}

export function parseMediaEnvironment(
  input: Readonly<Record<string, string | undefined>>
): MediaEnvironment {
  const switchResult = disabledEnvironmentSchema.parse({
    MEDIA_STORAGE_ENABLED: input["MEDIA_STORAGE_ENABLED"]
  });

  if (!switchResult.MEDIA_STORAGE_ENABLED) {
    return Object.freeze({ enabled: false });
  }

  const parsed = enabledEnvironmentSchema.parse(input);
  const publicBaseUrl = normalizePublicBaseUrl(parsed.MEDIA_PUBLIC_BASE_URL);
  const result: EnabledMediaEnvironment = {
    ...parsed,
    ...(publicBaseUrl === undefined ? {} : { MEDIA_PUBLIC_BASE_URL: publicBaseUrl }),
    enabled: true
  };
  return Object.freeze(result);
}

export const mediaLimits = Object.freeze({
  maximumDimension,
  maximumPixels,
  maximumTtlSeconds,
  maximumUploadBytes
});
