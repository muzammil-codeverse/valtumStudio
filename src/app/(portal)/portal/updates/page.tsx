import { headers } from "next/headers";
import Link from "next/link";

import { requireRole } from "@/modules/auth/server/authorization";
import { getClientDashboard } from "@/modules/portal/server/client-data";
import { PortalEmpty, PortalHeader } from "@/modules/portal/ui/PortalShell";

export const dynamic = "force-dynamic";

export default async function ClientUpdatesPage(): Promise<React.JSX.Element> {
  const principal = await requireRole(await headers(), "client");
  const data = await getClientDashboard(principal.userId);
  return (
    <>
      <PortalHeader
        eyebrow="DELIVERY / PROGRESS"
        title="Studio updates."
        description="Published progress notes across your engagements."
      />
      <section className="portal-panel">
        <div className="portal-panel-heading">
          <h2>Delivery journal</h2>
        </div>
        {data.updates.length === 0 ? (
          <PortalEmpty
            title="No updates published"
            description="Your delivery team will share approved progress updates here."
          />
        ) : (
          data.updates.map((item) => (
            <article className="portal-row" key={item.id}>
              <div className="portal-row-main">
                <strong>{item.title}</strong>
                <small>
                  {item.publishedAt?.toLocaleDateString("en-AU")} ·{" "}
                  <Link href={"/portal/projects/" + item.engagement.id}>
                    {item.engagement.title}
                  </Link>
                </small>
                <p className="portal-update-body">{item.body}</p>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
