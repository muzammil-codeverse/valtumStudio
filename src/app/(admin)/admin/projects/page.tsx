import { headers } from "next/headers";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { CmsList } from "@/modules/cms/shared/ui/CmsList";
export default async function ProjectsPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "projects", "read");
  const items = await prisma.project.findMany({
    select: { id: true, title: true, slug: true, status: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 100
  });
  return (
    <CmsList
      title="Projects"
      description="Manage structured case studies, sections, media, and publication state."
      items={items}
      createHref="/admin/projects/new"
      editBase="/admin/projects"
      emptyMessage="No projects have been created."
    />
  );
}
