import { headers } from "next/headers";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { CmsList } from "@/modules/cms/shared/ui/CmsList";
export default async function InsightsPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "insights", "read");
  const items = await prisma.insight.findMany({
    select: { id: true, title: true, slug: true, status: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 100
  });
  return (
    <CmsList
      title="Insights"
      description="Manage editorial articles, authors, categories, and publishing state."
      items={items}
      createHref="/admin/insights/new"
      editBase="/admin/insights"
      emptyMessage="No insights have been created."
    />
  );
}
