import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { saveNavigationAction } from "@/modules/cms/navigation/actions";
import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
export default async function NavigationItemPage({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "navigation", "read");
  const item = await prisma.navigationItem.findUnique({
    where: { id: (await params).id }
  });
  if (!item) notFound();
  return (
    <main className="p-6 max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Edit navigation item</h1>
      <CmsEditorForm
        action={saveNavigationAction}
        hidden={{ id: item.id, revision: item.revision }}
        fields={[
          { name: "label", label: "Label", defaultValue: item.label },
          { name: "location", label: "Location", defaultValue: item.location },
          { name: "type", label: "Type", defaultValue: item.type },
          { name: "href", label: "URL", defaultValue: item.href ?? "" },
          {
            name: "parentId",
            label: "Parent item ID",
            defaultValue: item.parentId ?? ""
          },
          {
            name: "sortOrder",
            label: "Display order",
            kind: "number",
            defaultValue: item.sortOrder
          },
          {
            name: "isEnabled",
            label: "Enabled",
            kind: "checkbox",
            defaultValue: item.isEnabled
          },
          {
            name: "openInNewTab",
            label: "Open external link in a new tab",
            kind: "checkbox",
            defaultValue: item.openInNewTab
          }
        ]}
      />
    </main>
  );
}
