import { headers } from "next/headers";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { CmsList } from "@/modules/cms/shared/ui/CmsList";
export default async function FaqsPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "faqs", "read");
  const items = await prisma.fAQGroup.findMany({
    select: { id: true, title: true, slug: true, status: true, updatedAt: true },
    orderBy: { sortOrder: "asc" },
    take: 100
  });
  return (
    <CmsList
      title="FAQs"
      description="Organize publishable FAQ groups and structured question-and-answer items."
      items={items}
      createHref="/admin/faqs/new"
      editBase="/admin/faqs"
      emptyMessage="No FAQ groups have been created."
    />
  );
}
