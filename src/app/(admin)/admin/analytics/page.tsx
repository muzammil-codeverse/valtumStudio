import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { fetchDashboardInsight } from "@/modules/admin/server/overview-insights";
import {
  LeadVolumeChart,
  PipelinePanel,
  RecentEnquiries
} from "@/modules/admin/ui/analytics/OperationsWorkspace";
import { requirePermission } from "@/modules/auth/server/authorization";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Enquiry Analytics | Valtum Studio",
  robots: { index: false }
};

export default async function AnalyticsPage(): Promise<React.JSX.Element> {
  const principal = await requirePermission(await headers(), "leads", "read");
  const insight = await fetchDashboardInsight(principal.role);
  return (
    <div className="ds-workspace">
      <div className="ds-hero">
        <div>
          <span className="ds-kicker">VALTUM / INTELLIGENCE</span>
          <h1>Conversation analytics.</h1>
          <p>Measured from your private enquiry records, never sample figures.</p>
        </div>
        <Link className="ds-outline-link" href="/admin/leads">
          Open lead CRM ↗
        </Link>
      </div>
      <div className="ds-stats">
        <div className="ds-stat ds-stat--dark">
          <span className="ds-stat-top">Total active enquiries</span>
          <strong>{insight.total}</strong>
          <span className="ds-stat-note">Excludes archived records</span>
        </div>
        <div className="ds-stat ds-stat--lilac">
          <span className="ds-stat-top">New conversations</span>
          <strong>{insight.newCount}</strong>
          <span className="ds-stat-note">Require initial review</span>
        </div>
        <div className="ds-stat ds-stat--blue">
          <span className="ds-stat-top">Currently qualified</span>
          <strong>{insight.qualifiedCount}</strong>
          <span className="ds-stat-note">At qualified stage</span>
        </div>
        <div className="ds-stat">
          <span className="ds-stat-top">Marked won</span>
          <strong>{insight.wonCount}</strong>
          <span className="ds-stat-note">CRM status, not booked revenue</span>
        </div>
      </div>
      <div className="ds-section-title">
        <div>
          <span className="ds-kicker">ENQUIRY ACTIVITY</span>
          <h2>The numbers behind the conversations.</h2>
        </div>
      </div>
      <div className="ds-bento-primary">
        <LeadVolumeChart insight={insight} />
        <PipelinePanel insight={insight} />
      </div>
      <div className="ds-bento-secondary">
        <RecentEnquiries insight={insight} />
        <section className="ds-panel">
          <span className="ds-kicker">DATA ETHICS</span>
          <h2 style={{ marginTop: 9, fontSize: 20, fontWeight: 750 }}>
            No artificial growth.
          </h2>
          <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7, color: "#65677b" }}>
            The figures on this page come from saved CRM records. Lost, closed and spam
            enquiries are not silently counted as active pipeline stages. No monetary
            revenue is inferred from a won enquiry.
          </p>
          <Link
            href="/admin/calendar"
            className="ds-outline-link"
            style={{ display: "inline-block", marginTop: 18 }}
          >
            View submission calendar ↗
          </Link>
        </section>
      </div>
    </div>
  );
}
