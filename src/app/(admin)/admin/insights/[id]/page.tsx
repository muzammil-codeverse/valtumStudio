import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { saveInsightAction } from "@/modules/cms/insights/actions";
import { MediaPicker } from "@/modules/cms/media/ui/MediaPicker";
import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
import { RichTextEditor } from "@/modules/cms/shared/ui/RichTextEditor";
export default async function InsightPage({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "insights", "read");
  const insight = await prisma.insight.findUnique({ where: { id: (await params).id } });
  if (!insight) notFound();
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Edit insight</h1>
      <CmsEditorForm
        action={saveInsightAction}
        hidden={{ id: insight.id, revision: insight.revision }}
        fields={[
          { name: "title", label: "Title", defaultValue: insight.title },
          { name: "slug", label: "Slug", defaultValue: insight.slug },
          {
            name: "excerpt",
            label: "Excerpt",
            kind: "textarea",
            defaultValue: insight.excerpt
          },
          {
            name: "categoryId",
            label: "Category ID",
            defaultValue: insight.categoryId
          },
          { name: "authorId", label: "Author ID", defaultValue: insight.authorId },
          {
            name: "featured",
            label: "Featured",
            kind: "checkbox",
            defaultValue: insight.featured
          }
        ]}
      >
        <RichTextEditor defaultValue={JSON.stringify(insight.bodyJson, null, 2)} />
        <MediaPicker
          defaultValue={insight.coverAssetId}
          label="Cover image"
          name="coverAssetId"
        />
        <MediaPicker
          defaultValue={insight.socialImageAssetId}
          label="Social image"
          name="socialImageAssetId"
        />
      </CmsEditorForm>
    </main>
  );
}
