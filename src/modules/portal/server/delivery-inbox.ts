import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { can } from "@/modules/auth/policies/authorization";
import { requireCompletedAuthentication } from "@/modules/auth/server/authorization";

import { isClientPortalEnabled } from "./client-data";

const CLIENT_KINDS = [
  "APPROVAL_REQUESTED",
  "PROGRESS_PUBLISHED",
  "INVOICE_ISSUED",
  "PROJECT_STATUS_CHANGED",
  "MILESTONE_STATUS_CHANGED",
  "TASK_STATUS_CHANGED",
  "MESSAGE_POSTED",
  "FILE_SHARED",
  "MILESTONE_EDITED",
  "TASK_EDITED",
  "PROJECT_PLAN_UPDATED"
];
const ADMIN_KINDS = [
  "APPROVAL_GRANTED",
  "CHANGES_REQUESTED",
  "MESSAGE_POSTED",
  "FILE_SHARED"
];
const PAGE_SIZE = 24;

export async function inboxPrincipal() {
  if (!isClientPortalEnabled()) notFound();
  const principal = await requireCompletedAuthentication(await headers());
  const customer = principal.role === "client";
  if (!customer && !can(principal.role, { resource: "clients", action: "read" })) {
    notFound();
  }
  return { principal, customer };
}

export function inboxFilter(userId: string, customer: boolean) {
  return {
    kind: { in: customer ? CLIENT_KINDS : ADMIN_KINDS },
    OR: [{ actorUserId: { not: userId } }, { actorUserId: null }],
    ...(customer
      ? {
          visibleToClient: true,
          engagement: { workspace: { memberships: { some: { userId } } } }
        }
      : { actor: { role: "client" } })
  };
}

export async function getDeliveryInbox(cursor: string | null) {
  const { principal, customer } = await inboxPrincipal();
  const where = inboxFilter(principal.userId, customer);
  const state = await prisma.clientActivityReadState.findUnique({
    where: { userId: principal.userId },
    select: { lastSeenAt: true, lastSeenId: true }
  });
  const lastSeenAt = state?.lastSeenAt ?? new Date(0);
  const lastSeenId = state?.lastSeenId ?? "";
  const next = cursor && /^[a-zA-Z0-9_-]{8,128}$/.test(cursor) ? cursor : null;
  if (
    next &&
    !(await prisma.clientDeliveryEvent.findFirst({
      where: { ...where, id: next },
      select: { id: true }
    }))
  )
    notFound();
  const pagination: { cursor?: { id: string }; skip?: number } = {};
  if (next) {
    pagination.cursor = { id: next };
    pagination.skip = 1;
  }
  const [rows, unread] = await Promise.all([
    prisma.clientDeliveryEvent.findMany({
      where,
      include: {
        actor: { select: { name: true } },
        engagement: {
          select: {
            id: true,
            title: true,
            workspaceId: true,
            workspace: { select: { name: true } }
          }
        }
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...pagination,
      take: PAGE_SIZE + 1
    }),
    prisma.clientDeliveryEvent.count({
      where: {
        ...where,
        AND: [
          {
            OR: [
              { createdAt: { gt: lastSeenAt } },
              { createdAt: lastSeenAt, id: { gt: lastSeenId } }
            ]
          }
        ]
      }
    })
  ]);
  const shown = rows.slice(0, PAGE_SIZE);
  return {
    customer,
    unread,
    records: shown.map((row) => ({
      ...row,
      unread:
        row.createdAt > lastSeenAt ||
        (row.createdAt.getTime() === lastSeenAt.getTime() && row.id > lastSeenId)
    })),
    nextCursor: rows.length > PAGE_SIZE ? (shown[shown.length - 1]?.id ?? null) : null
  };
}

export async function markDeliveryInboxRead(userId: string, customer: boolean) {
  const where = inboxFilter(userId, customer);
  const latest = await prisma.clientDeliveryEvent.findFirst({
    where,
    select: { createdAt: true, id: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
  if (!latest) return;
  const until = latest.createdAt;
  const latestId = latest.id;
  // A repeated or concurrent "mark read" cannot move the watermark backwards.
  try {
    await prisma.clientActivityReadState.create({
      data: { userId, lastSeenAt: until, lastSeenId: latestId }
    });
  } catch (error) {
    if (!(
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ))
      throw error;
    await prisma.clientActivityReadState.updateMany({
      where: {
        userId,
        OR: [
          { lastSeenAt: { lt: until } },
          { lastSeenAt: until, lastSeenId: { lt: latestId } }
        ]
      },
      data: { lastSeenAt: until, lastSeenId: latestId }
    });
  }
}
