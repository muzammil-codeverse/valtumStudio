import "server-only";

import type {
  SecurityEventOutcome,
  SecurityEventSeverity,
  SecurityEventType
} from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/database";

const forbiddenMetadataKey =
  /password|secret|token|cookie|backup|recovery|totp|authorization/i;
const maxMetadataDepth = 4;

type MetadataValue =
  boolean | number | string | null | MetadataValue[] | { [key: string]: MetadataValue };

export type SecurityEventInput = Readonly<{
  identifierHash?: string | undefined;
  ipAddress?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  outcome: SecurityEventOutcome;
  reasonCode?: string | undefined;
  requestId?: string | undefined;
  sessionId?: string | undefined;
  severity: SecurityEventSeverity;
  type: SecurityEventType;
  userAgent?: string | undefined;
  userId?: string | undefined;
}>;

function sanitizeMetadata(value: unknown, depth = 0): MetadataValue | undefined {
  if (depth > maxMetadataDepth || value === undefined) {
    return undefined;
  }
  if (value === null || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    return value.slice(0, 500);
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((entry) => sanitizeMetadata(entry, depth + 1))
      .filter((entry): entry is MetadataValue => entry !== undefined);
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !forbiddenMetadataKey.test(key))
        .slice(0, 20)
        .flatMap(([key, entry]) => {
          const sanitized = sanitizeMetadata(entry, depth + 1);
          return sanitized === undefined ? [] : [[key.slice(0, 80), sanitized]];
        })
    );
  }
  return undefined;
}

export async function recordSecurityEvent(input: SecurityEventInput): Promise<void> {
  const metadata =
    input.metadata === undefined ? undefined : sanitizeMetadata(input.metadata);

  const data: Prisma.SecurityEventUncheckedCreateInput = {
    outcome: input.outcome,
    severity: input.severity,
    type: input.type,
    ...(input.identifierHash === undefined
      ? {}
      : { identifierHash: input.identifierHash }),
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(metadata === undefined
      ? {}
      : {
          metadata:
            metadata === null ? Prisma.JsonNull : (metadata as Prisma.InputJsonValue)
        }),
    ...(input.reasonCode === undefined
      ? {}
      : { reasonCode: input.reasonCode.slice(0, 128) }),
    ...(input.requestId === undefined
      ? {}
      : { requestId: input.requestId.slice(0, 128) }),
    ...(input.sessionId === undefined ? {} : { sessionId: input.sessionId }),
    ...(input.userAgent === undefined
      ? {}
      : { userAgent: input.userAgent.slice(0, 512) }),
    ...(input.userId === undefined ? {} : { userId: input.userId })
  };

  await prisma.securityEvent.create({ data });
}
