import { notFound } from "next/navigation";

import { saveServiceAction } from "@/modules/cms/services/actions";
import { getService } from "@/modules/cms/services/queries";
import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
export default async function ServicePage({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const service = await getService((await params).id);
  if (!service) notFound();
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Edit service</h1>
      <CmsEditorForm
        action={saveServiceAction}
        hidden={{ id: service.id, revision: service.revision }}
        fields={[
          { name: "title", label: "Title", defaultValue: service.title },
          { name: "slug", label: "Slug", defaultValue: service.slug },
          {
            name: "summary",
            label: "Summary",
            kind: "textarea",
            defaultValue: service.summary
          },
          {
            name: "description",
            label: "Detailed description",
            kind: "textarea",
            defaultValue: service.description ?? ""
          },
          {
            name: "sortOrder",
            label: "Display order",
            kind: "number",
            defaultValue: service.sortOrder
          },
          {
            name: "featured",
            label: "Featured",
            kind: "checkbox",
            defaultValue: service.featured
          }
        ]}
      />
    </main>
  );
}
