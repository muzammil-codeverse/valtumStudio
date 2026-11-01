export type InvoiceInsightInput = Readonly<{
  amountCents: number;
  currency: string;
  status: string;
  issuedAt: Date | null;
}>;

type MonthlyAmount = Readonly<{
  key: string;
  label: string;
  cents: number;
}>;

export type ClientInvoiceSummary = Readonly<{
  currency: string;
  invoiceCount: number;
  totalCents: number;
  paidCents: number;
  outstandingCents: number;
  monthly: readonly MonthlyAmount[];
  monthlyMaxCents: number;
}>;

/**
 * Never aggregate different currencies into a fictional combined total.
 * This is an invoice-status summary, not an accounting ledger.
 */
export function summarizeClientInvoices(
  invoices: readonly InvoiceInsightInput[],
  asOf: Date = new Date()
): ClientInvoiceSummary[] {
  const grouped = new Map<string, InvoiceInsightInput[]>();
  for (const invoice of invoices) {
    if (invoice.status !== "ISSUED" && invoice.status !== "PAID") continue;
    if (!Number.isSafeInteger(invoice.amountCents) || invoice.amountCents < 0) continue;
    const currency = invoice.currency.toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) continue;
    grouped.set(currency, [...(grouped.get(currency) ?? []), invoice]);
  }

  const currentYear = asOf.getUTCFullYear();
  const currentMonth = asOf.getUTCMonth();
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(currentYear, currentMonth - (5 - index), 1));
    return {
      key: date.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("en-AU", {
        month: "short",
        timeZone: "UTC"
      }).format(date)
    };
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, rows]) => {
      const monthly: MonthlyAmount[] = buckets.map((bucket) => ({
        ...bucket,
        cents: rows
          .filter((row) => row.issuedAt?.toISOString().startsWith(bucket.key))
          .reduce((sum, row) => sum + row.amountCents, 0)
      }));
      const totalCents = rows.reduce((sum, row) => sum + row.amountCents, 0);
      const paidCents = rows
        .filter((row) => row.status === "PAID")
        .reduce((sum, row) => sum + row.amountCents, 0);
      return {
        currency,
        invoiceCount: rows.length,
        totalCents,
        paidCents,
        outstandingCents: totalCents - paidCents,
        monthly,
        monthlyMaxCents: Math.max(0, ...monthly.map((item) => item.cents))
      };
    });
}
