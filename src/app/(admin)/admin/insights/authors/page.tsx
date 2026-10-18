import { headers } from "next/headers";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { CmsList } from "@/modules/cms/shared/ui/CmsList";
export default async function InsightAuthorsPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "insights", "read");
  const records = await prisma.author.findMany({ orderBy: { name: "asc" } });
  return (
    <CmsList
      title="Authors"
      description="Editorial author profiles are intentionally separate from administrator accounts."
      items={records.map((item) => ({
        id: item.id,
        title: item.name,
        slug: item.slug,
        updatedAt: item.updatedAt
      }))}
      editBase="/admin/insights/authors"
      emptyMessage="No authors exist."
    />
  );
}
