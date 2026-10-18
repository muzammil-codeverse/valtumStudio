import { headers } from "next/headers";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { CmsList } from "@/modules/cms/shared/ui/CmsList";
export default async function InsightCategoriesPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "insights", "read");
  const records = await prisma.insightCategory.findMany({
    orderBy: { sortOrder: "asc" }
  });
  return (
    <CmsList
      title="Insight categories"
      description="Categories are reusable editorial taxonomies. A referenced category cannot be deleted."
      items={records.map((item) => ({
        id: item.id,
        title: item.name,
        slug: item.slug,
        updatedAt: item.updatedAt
      }))}
      editBase="/admin/insights/categories"
      emptyMessage="No categories exist."
    />
  );
}
