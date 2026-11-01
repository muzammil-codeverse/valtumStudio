import { headers } from "next/headers";
import Link from "next/link";

import { requireRole } from "@/modules/auth/server/authorization";
import {
  clientReadableStatus,
  getClientDashboard
} from "@/modules/portal/server/client-data";
import { PortalEmpty, PortalHeader } from "@/modules/portal/ui/PortalShell";

export const dynamic = "force-dynamic";

export default async function ClientProjectsPage(): Promise<React.JSX.Element> {
  const principal = await requireRole(await headers(), "client");
  const data = await getClientDashboard(principal.userId);
  return (
    <>
      <PortalHeader
        eyebrow="DELIVERY / PROJECTS"
        title="The work, beautifully clear."
        description="Your authorized studio engagements and their current stages."
      />
      <section className="portal-panel">
        <div className="portal-panel-heading">
          <h2>Your projects</h2>
          <span className="portal-tag">{data.engagements.length} total</span>
        </div>
        {data.engagements.length === 0 ? (
          <PortalEmpty
            title="No projects assigned"
            description="There are no client engagements associated with your account yet."
          />
        ) : (
          data.engagements.map((project) => (
            <div className="portal-row" key={project.id}>
              <div className="portal-row-main">
                <Link href={"/portal/projects/" + project.id}>{project.title}</Link>
                <small>
                  {project.workspace.name} ·{" "}
                  {project.summary ?? "Project details will be added by the studio."}
                </small>
              </div>
              <span className="portal-tag">{clientReadableStatus(project.status)}</span>
            </div>
          ))
        )}
      </section>
    </>
  );
}
