import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
import { RichTextEditor } from "@/modules/cms/shared/ui/RichTextEditor";
import { saveTeamMemberAction } from "@/modules/cms/team/actions";
export default function NewTeamMemberPage(): React.JSX.Element {
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">New team member</h1>
      <CmsEditorForm
        action={saveTeamMemberAction}
        fields={[
          { name: "name", label: "Name" },
          { name: "slug", label: "Slug" },
          { name: "roleTitle", label: "Role title" },
          { name: "shortBio", label: "Short bio", kind: "textarea" },
          { name: "linkedinUrl", label: "LinkedIn URL" },
          { name: "websiteUrl", label: "Website URL" },
          {
            name: "sortOrder",
            label: "Display order",
            kind: "number",
            defaultValue: 0
          },
          { name: "featured", label: "Featured", kind: "checkbox" }
        ]}
      >
        <RichTextEditor name="bioJson" label="Public biography" />
      </CmsEditorForm>
    </main>
  );
}
