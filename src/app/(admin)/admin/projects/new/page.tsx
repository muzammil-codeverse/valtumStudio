import { saveProjectAction } from "@/modules/cms/projects/actions";
import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
export default function NewProjectPage(): React.JSX.Element {
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">New project</h1>
      <CmsEditorForm
        action={saveProjectAction}
        fields={[
          { name: "title", label: "Title" },
          { name: "slug", label: "Slug" },
          { name: "summary", label: "Summary", kind: "textarea" },
          { name: "challenge", label: "Challenge", kind: "textarea" },
          { name: "solution", label: "Solution", kind: "textarea" },
          { name: "outcome", label: "Outcome", kind: "textarea" },
          { name: "projectYear", label: "Project year", kind: "number" },
          {
            name: "sortOrder",
            label: "Display order",
            kind: "number",
            defaultValue: 0
          },
          { name: "featured", label: "Featured", kind: "checkbox" }
        ]}
      />
    </main>
  );
}
