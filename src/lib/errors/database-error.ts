import { Prisma } from "@/generated/prisma/client";

const DB_UNAVAILABLE_CODES: ReadonlySet<string> = new Set([
  "P1001",
  "P1002",
  "P1017",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EHOSTUNREACH",
  "ETIMEDOUT",
  "ECONNRESET"
]);

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function matchesDbUnavailableCode(obj: Record<string, unknown>): boolean {
  if (typeof obj["code"] === "string" && DB_UNAVAILABLE_CODES.has(obj["code"])) {
    return true;
  }
  if (
    typeof obj["errorCode"] === "string" &&
    DB_UNAVAILABLE_CODES.has(obj["errorCode"])
  ) {
    return true;
  }
  return false;
}

/**
 * Recognises classified database unavailability errors (e.g. Prisma P1001, P1002, P1017
 * or driver adapter / network connection codes like ECONNREFUSED) using bounded structural
 * checks while letting validation, constraint, schema, and programming errors throw.
 */
export function isDatabaseUnavailableError(error: unknown): boolean {
  if (!isObjectRecord(error)) {
    return false;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (DB_UNAVAILABLE_CODES.has(error.code)) {
      return true;
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    if (error.errorCode && DB_UNAVAILABLE_CODES.has(error.errorCode)) {
      return true;
    }
  }

  const meta = error["meta"];
  if (isObjectRecord(meta)) {
    const adapterError = meta["driverAdapterError"];
    if (isObjectRecord(adapterError)) {
      if (matchesDbUnavailableCode(adapterError)) {
        return true;
      }
      const adapterCause = adapterError["cause"];
      if (isObjectRecord(adapterCause) && matchesDbUnavailableCode(adapterCause)) {
        return true;
      }
    }
  }

  if (matchesDbUnavailableCode(error)) {
    return true;
  }

  const cause = error["cause"];
  if (isObjectRecord(cause)) {
    if (matchesDbUnavailableCode(cause)) {
      return true;
    }
    const innerCause = cause["cause"];
    if (isObjectRecord(innerCause) && matchesDbUnavailableCode(innerCause)) {
      return true;
    }
  }

  return false;
}
