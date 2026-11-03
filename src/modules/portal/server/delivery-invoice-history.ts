import "server-only";

import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";

const PAGE_SIZE = 24;

export async function getClientInvoiceHistory(userId: string, rawCursor?: string) {
  const where = {
    status: { in: ["ISSUED" as const, "PAID" as const] },
    engagement: { workspace: { memberships: { some: { userId } } } }
  };
  const cursor =
    rawCursor && /^[a-zA-Z0-9_-]{8,128}$/.test(rawCursor) ? rawCursor : null;
  if (
    cursor &&
    !(await prisma.clientInvoice.findFirst({
      where: { ...where, id: cursor },
      select: { id: true }
    }))
  )
    notFound();
  const pagination: { cursor?: { id: string }; skip?: number } = {};
  if (cursor) {
    pagination.cursor = { id: cursor };
    pagination.skip = 1;
  }
  const records = await prisma.clientInvoice.findMany({
    where,
    include: { engagement: { select: { title: true, id: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...pagination,
    take: PAGE_SIZE + 1
  });
  const shown = records.slice(0, PAGE_SIZE);
  return {
    invoices: shown,
    nextCursor:
      records.length > PAGE_SIZE ? (shown[shown.length - 1]?.id ?? null) : null
  };
}
