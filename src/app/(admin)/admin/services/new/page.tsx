import { saveServiceAction } from "@/modules/cms/services/actions";
import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
export default function NewServicePage(): React.JSX.Element {
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">New service</h1>
      <CmsEditorForm
        action={saveServiceAction}
        fields={[
          { name: "title", label: "Title" },
          { name: "slug", label: "Slug" },
          { name: "summary", label: "Summary", kind: "textarea" },
          { name: "description", label: "Detailed description", kind: "textarea" },
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
