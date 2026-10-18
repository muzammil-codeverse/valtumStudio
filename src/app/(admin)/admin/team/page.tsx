import { headers } from "next/headers";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { CmsList } from "@/modules/cms/shared/ui/CmsList";
export default async function TeamPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "team", "read");
  const items = await prisma.teamMember.findMany({
    select: { id: true, name: true, slug: true, status: true, updatedAt: true },
    orderBy: { sortOrder: "asc" },
    take: 100
  });
  return (
    <CmsList
      title="Team"
      description="Manage public team profiles, biographies, media, and publication state."
      items={items.map(({ name, ...item }) => ({ ...item, title: name }))}
      createHref="/admin/team/new"
      editBase="/admin/team"
      emptyMessage="No team profiles have been created."
    />
  );
}
