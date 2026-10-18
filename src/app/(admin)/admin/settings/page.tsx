import { headers } from "next/headers";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { saveSettingsAction } from "@/modules/cms/settings/actions";
import { CmsEditorForm } from "@/modules/cms/shared/ui/CmsEditorForm";
export default async function SettingsPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "siteSettings", "read");
  const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold">Settings</h1>
      <p className="mb-6 text-sm text-[var(--admin-text-secondary)]">
        Only approved setting groups are accepted; secret-like keys are rejected on the
        server.
      </p>
      <CmsEditorForm
        action={saveSettingsAction}
        submitLabel="Save settings group"
        fields={[
          {
            name: "group",
            label: "Group (identity, contact, social, seo, or legal)",
            defaultValue: "identity"
          },
          {
            name: "value",
            label: "Structured group value JSON",
            kind: "textarea",
            defaultValue: JSON.stringify({ siteName: "Siglum Studio" }, null, 2)
          }
        ]}
      />
      {settings.length ? (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold">Stored approved groups</h2>
          <ul className="space-y-2 text-sm">
            {settings.map((setting) => (
              <li
                key={setting.id}
                className="rounded border border-[var(--admin-border)] p-3"
              >
                <strong>{setting.key}</strong>
                <pre className="mt-2 overflow-auto text-xs">
                  {JSON.stringify(setting.value, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
