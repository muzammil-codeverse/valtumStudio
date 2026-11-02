import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/modules/auth/server/authorization";
import {
  clientReadableStatus,
  formatClientMoney,
  getClientEngagement
} from "@/modules/portal/server/client-data";
import { DeliveryWorkroom } from "@/modules/portal/ui/DeliveryWorkroom";
import { PortalEmpty, PortalHeader } from "@/modules/portal/ui/PortalShell";

export const dynamic = "force-dynamic";

export default async function ClientProjectPage({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const principal = await requireRole(await headers(), "client");
  const { id } = await params;
  if (!id || id.length > 128) notFound();
  const project = await getClientEngagement(principal.userId, id);
  if (!project) notFound();
  return (
    <>
      <PortalHeader
        eyebrow={"PROJECT / " + project.workspace.name.toUpperCase()}
        title={project.title}
        description={
          project.summary ?? "Project details are being prepared by your delivery team."
        }
        action={<Link href="/portal/projects">← All projects</Link>}
      />
      <div className="portal-stat-row">
        <div className="portal-stat portal-stat--ink">
          <label>Delivery status</label>
          <strong style={{ fontSize: 26, textTransform: "capitalize" }}>
            {clientReadableStatus(project.status)}
          </strong>
          <small>Recorded engagement state</small>
        </div>
        <div className="portal-stat portal-stat--lilac">
          <label>Milestones</label>
          <strong>{project.milestones.length}</strong>
          <small>Planned work stages</small>
        </div>
        <div className="portal-stat portal-stat--blue">
          <label>Tasks</label>
          <strong>{project.tasks.length}</strong>
          <small>Tracked delivery items</small>
        </div>
        <div className="portal-stat">
          <label>Target date</label>
          <strong style={{ fontSize: 21 }}>
            {project.targetDate?.toLocaleDateString("en-AU") ?? "TBC"}
          </strong>
          <small>Current estimated target, when set</small>
        </div>
      </div>
      <div className="portal-grid">
        <section className="portal-panel">
          <div className="portal-panel-heading">
            <h2>Milestones</h2>
          </div>
          {project.milestones.length === 0 ? (
            <PortalEmpty
              title="No milestones recorded"
              description="The studio will publish work stages here once your delivery plan is finalized."
            />
          ) : (
            project.milestones.map((m, index) => (
              <div className="portal-row" key={m.id}>
                <div className="portal-row-main">
                  <strong>
                    {String(index + 1).padStart(2, "0")} / {m.title}
                  </strong>
                  <small>
                    {m.dueDate
                      ? "Due " + m.dueDate.toLocaleDateString("en-AU")
                      : "Date to be confirmed"}
                  </small>
                </div>
                <span className="portal-tag">{clientReadableStatus(m.status)}</span>
              </div>
            ))
          )}
        </section>
        <section className="portal-panel portal-panel--ink">
          <div className="portal-panel-heading">
            <h2>Delivery tasks</h2>
          </div>
          {project.tasks.length === 0 ? (
            <PortalEmpty
              title="Nothing scheduled yet"
              description="Tracked tasks will appear when your delivery plan is ready."
            />
          ) : (
            project.tasks.map((task) => (
              <div className="portal-row portal-row--ink" key={task.id}>
                <div className="portal-row-main">
                  <strong>{task.title}</strong>
                  <small>
                    {task.dueDate?.toLocaleDateString("en-AU") ?? "Flexible timing"}
                  </small>
                </div>
                <span className="portal-tag">{clientReadableStatus(task.status)}</span>
              </div>
            ))
          )}
        </section>
      </div>
      <div className="portal-grid">
        <section className="portal-panel">
          <div className="portal-panel-heading">
            <h2>Published updates</h2>
          </div>
          {project.updates.length === 0 ? (
            <PortalEmpty
              title="No published updates"
              description="When your team shares progress, the notes will appear here."
            />
          ) : (
            project.updates.map((update) => (
              <div className="portal-row" key={update.id}>
                <div className="portal-row-main">
                  <strong>{update.title}</strong>
                  <small>{update.publishedAt?.toLocaleDateString("en-AU")}</small>
                  <p className="portal-update-body">{update.body}</p>
                </div>
              </div>
            ))
          )}
        </section>
        <section className="portal-panel">
          <div className="portal-panel-heading">
            <h2>Issued invoices</h2>
            <Link href="/portal/invoices">Billing overview ↗</Link>
          </div>
          {project.invoices.length === 0 ? (
            <PortalEmpty
              title="No issued invoices"
              description="Your issued billing records will appear here."
            />
          ) : (
            project.invoices.map((invoice) => (
              <div className="portal-row" key={invoice.id}>
                <div className="portal-row-main">
                  <strong>{invoice.reference}</strong>
                  <small>{clientReadableStatus(invoice.status)}</small>
                </div>
                <span className="portal-amount">
                  {formatClientMoney(invoice.amountCents, invoice.currency)}
                </span>
              </div>
            ))
          )}
        </section>
      </div>

      <DeliveryWorkroom
        engagementId={project.id}
        tasks={project.tasks}
        milestones={project.milestones}
      />
    </>
  );
}
