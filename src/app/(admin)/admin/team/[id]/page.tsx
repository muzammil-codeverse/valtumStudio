import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
import { RichTextEditor } from "@/modules/cms/shared/ui/RichTextEditor";
import { saveTeamMemberAction } from "@/modules/cms/team/actions";
export default async function TeamMemberPage({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "team", "read");
  const member = await prisma.teamMember.findUnique({
    where: { id: (await params).id }
  });
  if (!member) notFound();
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Edit team member</h1>
      <CmsEditorForm
        action={saveTeamMemberAction}
        hidden={{ id: member.id, revision: member.revision }}
        fields={[
          { name: "name", label: "Name", defaultValue: member.name },
          { name: "slug", label: "Slug", defaultValue: member.slug },
          { name: "roleTitle", label: "Role title", defaultValue: member.roleTitle },
          {
            name: "shortBio",
            label: "Short bio",
            kind: "textarea",
            defaultValue: member.shortBio ?? ""
          },
          {
            name: "linkedinUrl",
            label: "LinkedIn URL",
            defaultValue: member.linkedinUrl ?? ""
          },
          {
            name: "websiteUrl",
            label: "Website URL",
            defaultValue: member.websiteUrl ?? ""
          },
          {
            name: "sortOrder",
            label: "Display order",
            kind: "number",
            defaultValue: member.sortOrder
          },
          {
            name: "featured",
            label: "Featured",
            kind: "checkbox",
            defaultValue: member.featured
          }
        ]}
      >
        <RichTextEditor
          label="Public biography"
          name="bioJson"
          {...(member.bioJson === null
            ? {}
            : {
                defaultValue: JSON.stringify(member.bioJson, null, 2)
              })}
        />
      </CmsEditorForm>
    </main>
  );
}
