import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { saveFaqGroupAction } from "@/modules/cms/faqs/actions";
import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
export default async function FaqGroupPage({
  params
}: {
  params: Promise<{ groupId: string }>;
}): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "faqs", "read");
  const group = await prisma.fAQGroup.findUnique({
    where: { id: (await params).groupId },
    include: { items: { orderBy: { sortOrder: "asc" } } }
  });
  if (!group) notFound();
  const items = group.items.map((item) => ({
    id: item.id,
    question: item.question,
    answerJson: item.answerJson,
    isActive: item.isActive,
    sortOrder: item.sortOrder
  }));
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Edit FAQ group</h1>
      <CmsEditorForm
        action={saveFaqGroupAction}
        hidden={{ id: group.id, revision: group.revision }}
        fields={[
          { name: "title", label: "Title", defaultValue: group.title },
          { name: "slug", label: "Slug", defaultValue: group.slug },
          {
            name: "description",
            label: "Description",
            kind: "textarea",
            defaultValue: group.description ?? ""
          },
          {
            name: "sortOrder",
            label: "Display order",
            kind: "number",
            defaultValue: group.sortOrder
          },
          {
            name: "items",
            label: "Structured items JSON",
            kind: "textarea",
            defaultValue: JSON.stringify(items, null, 2)
          }
        ]}
      />
    </main>
  );
}
