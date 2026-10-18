import { saveFaqGroupAction } from "@/modules/cms/faqs/actions";
import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
export default function NewFaqGroupPage(): React.JSX.Element {
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">New FAQ group</h1>
      <CmsEditorForm
        action={saveFaqGroupAction}
        fields={[
          { name: "title", label: "Title" },
          { name: "slug", label: "Slug" },
          { name: "description", label: "Description", kind: "textarea" },
          {
            name: "sortOrder",
            label: "Display order",
            kind: "number",
            defaultValue: 0
          },
          {
            name: "items",
            label: "Structured items JSON",
            kind: "textarea",
            description:
              "Each item requires question, answerJson, isActive, and sortOrder."
          }
        ]}
      />
    </main>
  );
}
