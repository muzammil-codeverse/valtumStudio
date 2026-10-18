import { saveInsightAction } from "@/modules/cms/insights/actions";
import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
import { RichTextEditor } from "@/modules/cms/shared/ui/RichTextEditor";
export default function NewInsightPage(): React.JSX.Element {
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">New insight</h1>
      <CmsEditorForm
        action={saveInsightAction}
        fields={[
          { name: "title", label: "Title" },
          { name: "slug", label: "Slug" },
          { name: "excerpt", label: "Excerpt", kind: "textarea" },
          { name: "categoryId", label: "Category ID" },
          { name: "authorId", label: "Author ID" },
          { name: "featured", label: "Featured", kind: "checkbox" }
        ]}
      >
        <RichTextEditor />
      </CmsEditorForm>
    </main>
  );
}
