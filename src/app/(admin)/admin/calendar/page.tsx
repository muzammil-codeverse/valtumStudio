import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import {
  fetchDashboardInsight,
  parseDashboardMonth
} from "@/modules/admin/server/overview-insights";
import { EnquiryCalendar } from "@/modules/admin/ui/analytics/OperationsWorkspace";
import { requirePermission } from "@/modules/auth/server/authorization";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Enquiry Calendar | Valtum Studio",
  robots: { index: false }
};

export default async function CalendarPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string }>;
}): Promise<React.JSX.Element> {
  const principal = await requirePermission(await headers(), "leads", "read");
  const month = parseDashboardMonth((await searchParams).month);
  const insight = await fetchDashboardInsight(principal.role, month);
  return (
    <div className="ds-workspace">
      <div className="ds-hero">
        <div>
          <span className="ds-kicker">VALTUM / CALENDAR</span>
          <h1>Activity, in context.</h1>
          <p>A precise calendar of enquiries submitted to your studio.</p>
        </div>
        <Link href="/admin/leads" className="ds-outline-link">
          Review CRM ↗
        </Link>
      </div>
      <div style={{ maxWidth: 750 }}>
        <EnquiryCalendar insight={insight} />
      </div>
    </div>
  );
}
