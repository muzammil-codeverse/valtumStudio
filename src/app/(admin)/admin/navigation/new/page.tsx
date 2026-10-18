import { saveNavigationAction } from "@/modules/cms/navigation/actions";
import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
export default function NewNavigationPage(): React.JSX.Element {
  return (
    <main className="p-6 max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">New navigation item</h1>
      <CmsEditorForm
        action={saveNavigationAction}
        fields={[
          { name: "label", label: "Label" },
          {
            name: "location",
            label: "Location (PRIMARY, FOOTER, or LEGAL)",
            defaultValue: "PRIMARY"
          },
          {
            name: "type",
            label: "Type (INTERNAL, EXTERNAL, GROUP, or CTA)",
            defaultValue: "INTERNAL"
          },
          { name: "href", label: "URL" },
          { name: "parentId", label: "Parent item ID" },
          {
            name: "sortOrder",
            label: "Display order",
            kind: "number",
            defaultValue: 0
          },
          { name: "isEnabled", label: "Enabled", kind: "checkbox", defaultValue: true },
          {
            name: "openInNewTab",
            label: "Open external link in a new tab",
            kind: "checkbox"
          }
        ]}
      />
    </main>
  );
}
