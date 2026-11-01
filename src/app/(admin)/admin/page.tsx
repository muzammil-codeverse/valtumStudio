import type { Metadata } from "next";
import { headers } from "next/headers";

import { isDatabaseReady } from "@/lib/database";
import { fetchDashboardSummary } from "@/modules/admin/server/dashboard-queries";
import { fetchDashboardInsight } from "@/modules/admin/server/overview-insights";
import { OperationsWorkspace } from "@/modules/admin/ui/analytics/OperationsWorkspace";
import { requirePermission } from "@/modules/auth/server/authorization";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio Overview | Valtum Studio",
  description: "Private studio operations, enquiry analytics and content health."
};

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const principal = await requirePermission(await headers(), "dashboard", "read");
  const [summary, insight, databaseReady] = await Promise.all([
    fetchDashboardSummary(principal.role),
    fetchDashboardInsight(principal.role),
    isDatabaseReady()
  ]);

  return (
    <OperationsWorkspace
      name={principal.name}
      role={principal.role}
      summary={summary}
      insight={insight}
      databaseReady={databaseReady}
    />
  );
}
