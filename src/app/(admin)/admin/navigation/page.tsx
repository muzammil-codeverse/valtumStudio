import { headers } from "next/headers";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { CmsList } from "@/modules/cms/shared/ui/CmsList";
export default async function NavigationPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "navigation", "read");
  const records = await prisma.navigationItem.findMany({
    select: { id: true, label: true, href: true, updatedAt: true },
    orderBy: [{ location: "asc" }, { sortOrder: "asc" }],
    take: 100
  });
  const items = records.map((item) => ({
    id: item.id,
    title: item.label,
    slug: item.href ?? "Group",
    updatedAt: item.updatedAt
  }));
  return (
    <CmsList
      title="Navigation"
      description="Manage the validated primary, footer, and legal navigation tree."
      items={items}
      createHref="/admin/navigation/new"
      editBase="/admin/navigation"
      emptyMessage="No navigation items have been created."
    />
  );
}
