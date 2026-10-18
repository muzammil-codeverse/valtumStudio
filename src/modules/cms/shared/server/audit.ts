import "server-only";

import type { AuditAction, Prisma, PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/database";

type AuditClient = Pick<PrismaClient, "auditEvent">;

export type ContentAuditInput = Readonly<{
  actorUserId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  summary: string;
  changes?: Prisma.InputJsonValue;
}>;

export async function writeContentAudit(
  input: ContentAuditInput,
  client: AuditClient = prisma
): Promise<void> {
  const data: Prisma.AuditEventUncheckedCreateInput = {
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    ...(input.entityLabel === undefined ? {} : { entityLabel: input.entityLabel }),
    ...(input.changes === undefined ? {} : { changes: input.changes })
  };

  await client.auditEvent.create({ data });
}
