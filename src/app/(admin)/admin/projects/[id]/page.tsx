import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { MediaPicker } from "@/modules/cms/media/ui/MediaPicker";
import { saveProjectAction } from "@/modules/cms/projects/actions";
import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
export default async function ProjectPage({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "projects", "read");
  const project = await prisma.project.findUnique({ where: { id: (await params).id } });
  if (!project) notFound();
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Edit project</h1>
      <CmsEditorForm
        action={saveProjectAction}
        hidden={{ id: project.id, revision: project.revision }}
        fields={[
          { name: "title", label: "Title", defaultValue: project.title },
          { name: "slug", label: "Slug", defaultValue: project.slug },
          {
            name: "summary",
            label: "Summary",
            kind: "textarea",
            defaultValue: project.summary
          },
          {
            name: "challenge",
            label: "Challenge",
            kind: "textarea",
            defaultValue: project.challenge ?? ""
          },
          {
            name: "solution",
            label: "Solution",
            kind: "textarea",
            defaultValue: project.solution ?? ""
          },
          {
            name: "outcome",
            label: "Outcome",
            kind: "textarea",
            defaultValue: project.outcome ?? ""
          },
          {
            name: "projectYear",
            label: "Project year",
            kind: "number",
            defaultValue: project.projectYear ?? ""
          },
          {
            name: "sortOrder",
            label: "Display order",
            kind: "number",
            defaultValue: project.sortOrder
          },
          {
            name: "featured",
            label: "Featured",
            kind: "checkbox",
            defaultValue: project.featured
          }
        ]}
      >
        <MediaPicker
          defaultValue={project.coverAssetId}
          label="Cover image"
          name="coverAssetId"
        />
        <MediaPicker
          defaultValue={project.socialImageAssetId}
          label="Social image"
          name="socialImageAssetId"
        />
      </CmsEditorForm>
    </main>
  );
}
