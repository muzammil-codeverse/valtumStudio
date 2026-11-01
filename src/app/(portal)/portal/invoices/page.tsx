import { headers } from "next/headers";

import { requireRole } from "@/modules/auth/server/authorization";
import {
  clientReadableStatus,
  formatClientMoney,
  getClientDashboard
} from "@/modules/portal/server/client-data";
import { PortalEmpty, PortalHeader } from "@/modules/portal/ui/PortalShell";

export const dynamic = "force-dynamic";

export default async function ClientInvoicesPage(): Promise<React.JSX.Element> {
  const principal = await requireRole(await headers(), "client");
  const data = await getClientDashboard(principal.userId);
  return (
    <>
      <PortalHeader eyebrow="WORKSPACE / BILLING" title="Your invoices." description="Only invoices issued by the studio are shown. Payment processing is not connected in this portal." />
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
