import { headers } from "next/headers";

import { requireRole } from "@/modules/auth/server/authorization";
import {
  clientReadableStatus,
  formatClientMoney,
  getClientDashboard
} from "@/modules/portal/server/client-data";
import { PortalEmpty, PortalHeader } from "@/modules/portal/ui/PortalShell";
import { summarizeClientInvoices } from "@/modules/portal/server/invoice-insights";

export const dynamic = "force-dynamic";

export default async function ClientInvoicesPage(): Promise<React.JSX.Element> {
  const principal = await requireRole(await headers(), "client");
  const data = await getClientDashboard(principal.userId);
  const billing = summarizeClientInvoices(data.invoices);
  return (
    <>
      <PortalHeader eyebrow="WORKSPACE / BILLING" title="Your invoices." description="Only invoices issued by the studio are shown. Payment processing is not connected in this portal." />
      {billing.length > 0 ? (
        <div className="portal-finance-overview">
          {billing.map((summary) => (
            <section className="portal-panel portal-finance-card" key={summary.currency}>
              <div className="portal-panel-heading">
                <div>
                  <span className="portal-kicker">BILLING / {summary.currency}</span>
                  <h2>Invoice overview</h2>
                </div>
                <span className="portal-tag">{summary.invoiceCount} invoices</span>
              </div>
              <div className="portal-finance-totals">
                <div>
                  <small>Total issued</small>
                  <strong>{formatClientMoney(summary.totalCents, summary.currency)}</strong>
                </div>
                <div>
                  <small>Paid</small>
                  <strong>{formatClientMoney(summary.paidCents, summary.currency)}</strong>
                </div>
                <div>
                  <small>Outstanding</small>
                  <strong>{formatClientMoney(summary.outstandingCents, summary.currency)}</strong>
                </div>
              </div>
              <div className="portal-finance-graph-heading">
                <span>Invoiced over the last six UTC months</span>
                <strong>{summary.currency}</strong>
              </div>
              <div
                className="portal-finance-chart"
                role="img"
                aria-label={
                  "Six months of issued invoices in " + summary.currency + ": " +
                  summary.monthly.map((month) => month.label + " " +
                    formatClientMoney(month.cents, summary.currency)).join(", ")
                }
              >
                {summary.monthly.map((month) => (
                  <div className="portal-finance-month" key={month.key}>
                    <div className="portal-finance-track">
                      <div
                        className="portal-finance-bar"
                        style={{
                          height: summary.monthlyMaxCents === 0
                            ? "0%"
                            : (month.cents / summary.monthlyMaxCents) * 100 + "%"
                        }}
                      />
                    </div>
                    <span>{month.label}</span>
                  </div>
                ))}
              </div>
              <p className="portal-finance-note">
                Based only on issued and paid invoices. A paid status is recorded
                in the portal; this is not a verified bank reconciliation.
              </p>
            </section>
          ))}
        </div>
      ) : null}
      <section className="portal-panel">
        <div className="portal-panel-heading"><h2>Billing history</h2><span className="portal-tag">{data.invoices.length} issued and paid</span></div>
        {data.invoices.length === 0 ? (
          <PortalEmpty title="No invoices have been issued" description="This space will list your actual issued invoices and payment status." />
        ) : data.invoices.map((invoice) => (
          <div className="portal-row" key={invoice.id}>
            <div className="portal-row-main">
              <strong>{invoice.reference}</strong>
              <small>{invoice.engagement.title} · {invoice.dueDate ? "Due " + invoice.dueDate.toLocaleDateString("en-AU") : "No due date set"}</small>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong className="portal-amount">{formatClientMoney(invoice.amountCents, invoice.currency)}</strong>
              <span className="portal-tag" style={{ marginTop: 6, display: "inline-block" }}>{clientReadableStatus(invoice.status)}</span>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
