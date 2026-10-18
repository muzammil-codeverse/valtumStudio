import "server-only";

import { createHmac } from "node:crypto";

import { prisma } from "@/lib/database";

export function hashAuthenticationIdentifier(
  normalizedEmail: string,
  key: string
): string {
  return createHmac("sha256", key).update(normalizedEmail, "utf8").digest("base64url");
}

export type LoginThrottleResult = Readonly<{
  isLocked: boolean;
  justLocked: boolean;
}>;

export async function isAuthenticationIdentifierLocked(
  identifierHash: string,
  now = new Date()
): Promise<boolean> {
  const throttle = await prisma.authThrottle.findUnique({ where: { identifierHash } });
  return (
    throttle?.lockedUntil !== null &&
    throttle?.lockedUntil !== undefined &&
    throttle.lockedUntil > now
  );
}

export async function recordAuthenticationFailure(
  identifierHash: string,
  options: Readonly<{
    lockSeconds: number;
    maxAttempts: number;
    windowSeconds: number;
  }>,
  now = new Date()
): Promise<LoginThrottleResult> {
  const windowStart = new Date(now.getTime() - options.windowSeconds * 1000);

  const increment = () =>
    prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.authThrottle.findUnique({
          where: { identifierHash }
        });
        if (existing === null) {
          const isLocked = options.maxAttempts <= 1;
          await transaction.authThrottle.create({
            data: {
              failureCount: 1,
              identifierHash,
              lastFailureAt: now,
              lockedUntil: isLocked
                ? new Date(now.getTime() + options.lockSeconds * 1000)
                : null,
              windowStartedAt: now
            }
          });
          return { isLocked, justLocked: isLocked };
        }

        if (existing.lockedUntil !== null && existing.lockedUntil > now) {
          return { isLocked: true, justLocked: false };
        }

        const failureCount =
          existing.windowStartedAt < windowStart ? 1 : existing.failureCount + 1;
        const isLocked = failureCount >= options.maxAttempts;
        await transaction.authThrottle.update({
          data: {
            failureCount,
            lastFailureAt: now,
            lockedUntil: isLocked
              ? new Date(now.getTime() + options.lockSeconds * 1000)
              : null,
            windowStartedAt:
              existing.windowStartedAt < windowStart ? now : existing.windowStartedAt
          },
          where: { id: existing.id }
        });
        return { isLocked, justLocked: isLocked };
      },
      { isolationLevel: "Serializable" }
    );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await increment();
    } catch (error) {
      if (
        attempt === 2 ||
        !(error instanceof Error) ||
        !error.message.includes("P2034")
      ) {
        throw error;
      }
    }
  }
  throw new Error("Authentication throttle transaction retry limit reached.");
}

export async function clearAuthenticationFailures(
  identifierHash: string
): Promise<void> {
  await prisma.authThrottle.deleteMany({ where: { identifierHash } });
}
