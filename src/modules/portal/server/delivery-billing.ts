import "server-only";

import { prisma } from "@/lib/database";

import type { ClientInvoiceSummary } from "./invoice-insights";

type MonthlyTotal = Readonly<{
  currency: string;
  month: Date;
  cents: bigint;
}>;

export async function getClientBillingInsights(
  userId: string,
  asOf = new Date()
): Promise<ClientInvoiceSummary[]> {
  const start = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - 5, 1));
  const end = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() + 1, 1));
  const [groups, monthlyTotals] = await Promise.all([
    prisma.clientInvoice.groupBy({
      by: ["currency", "status"],
      where: {
        status: { in: ["ISSUED", "PAID"] },
        engagement: { workspace: { memberships: { some: { userId } } } }
      },
      _count: { _all: true },
      _sum: { amountCents: true }
    }),
    prisma.$queryRaw<MonthlyTotal[]>`
      SELECT ci.currency,
             date_trunc('month', ci.issued_at) AS month,
             SUM(ci.amount_cents)::bigint AS cents
      FROM client_invoices ci
      JOIN client_engagements ce ON ci.engagement_id = ce.id
      JOIN client_memberships cm ON cm.workspace_id = ce.workspace_id
      WHERE cm.user_id = ${userId}
        AND ci.status::text IN ('ISSUED', 'PAID')
        AND ci.issued_at >= ${start}
        AND ci.issued_at < ${end}
      GROUP BY ci.currency, date_trunc('month', ci.issued_at)
    `
  ]);

  const buckets = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(
      Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - 5 + index, 1)
    );
    return {
      key: month.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("en-AU", {
        month: "short",
        timeZone: "UTC"
      }).format(month)
    };
  });
  const money = (value: number | bigint) => {
    const result = Number(value);
    if (!Number.isSafeInteger(result) || result < 0) {
      throw new Error("Invoice analytics exceed the supported integer range.");
    }
    return result;
  };
  const monthAmounts = new Map<string, number>();
  for (const total of monthlyTotals) {
    monthAmounts.set(
      total.currency + "/" + total.month.toISOString().slice(0, 7),
      money(total.cents)
    );
  }
  const byCurrency = new Map<
    string,
    { invoiceCount: number; totalCents: number; paidCents: number }
  >();
  for (const group of groups) {
    const existing = byCurrency.get(group.currency) ?? {
      invoiceCount: 0,
      totalCents: 0,
      paidCents: 0
    };
    const amount = money(group._sum.amountCents ?? 0);
    existing.invoiceCount += group._count._all;
    existing.totalCents += amount;
    if (group.status === "PAID") existing.paidCents += amount;
    byCurrency.set(group.currency, existing);
  }
  return Array.from(byCurrency.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, totals]) => {
      const monthly = buckets.map((bucket) => ({
        ...bucket,
        cents: monthAmounts.get(currency + "/" + bucket.key) ?? 0
      }));
      return {
        currency,
        ...totals,
        outstandingCents: totals.totalCents - totals.paidCents,
        monthly,
        monthlyMaxCents: Math.max(0, ...monthly.map((row) => row.cents))
      };
    });
}
