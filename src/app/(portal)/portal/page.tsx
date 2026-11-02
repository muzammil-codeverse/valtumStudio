import { headers } from "next/headers";
import Link from "next/link";

import { requireRole } from "@/modules/auth/server/authorization";
import { summarizeDelivery } from "@/modules/portal/domain/delivery-insights";
import {
  clientReadableStatus,
  getClientDashboard
} from "@/modules/portal/server/client-data";
import { PortalEmpty, PortalHeader } from "@/modules/portal/ui/PortalShell";

export const dynamic = "force-dynamic";

export default async function ClientOverviewPage(): Promise<React.JSX.Element> {
  const principal = await requireRole(await headers(), "client");
  const data = await getClientDashboard(principal.userId);
  const delivery = summarizeDelivery(data);
  const activeProjects = data.engagements.filter(
    (project) => project.status !== "COMPLETE" && project.status !== "ON_HOLD"
  );
  const openTasks = data.tasks.filter((task) => task.status !== "DONE");
  const pendingMilestones = data.milestones.filter(
    (milestone) => milestone.status !== "COMPLETE" && milestone.status !== "APPROVED"
  );
  const issuedInvoices = data.invoices.filter((invoice) => invoice.status === "ISSUED");
  return (
    <>
      <PortalHeader
        eyebrow="YOUR STUDIO PARTNERSHIP"
        title={"Welcome back, " + principal.name.trim().split(" ")[0] + "."}
        description="Your delivery, milestones, invoices and decisions in one considered place."
        action={<a href="mailto:hello@valtumstudio.com.au">Contact the studio ↗</a>}
      />
      <div className="portal-stat-row">
        <div className="portal-stat portal-stat--ink">
          <label>Active engagements</label>
          <strong>{activeProjects.length}</strong>
          <small>Client projects in progress or planning</small>
        </div>
        <div className="portal-stat portal-stat--lilac">
          <label>Open tasks</label>
          <strong>{openTasks.length}</strong>
          <small>Recorded delivery tasks awaiting completion</small>
        </div>
        <div className="portal-stat portal-stat--blue">
          <label>Upcoming milestones</label>
          <strong>{pendingMilestones.length}</strong>
          <small>Awaiting completion or approval</small>
        </div>
        <div className="portal-stat">
          <label>Issued invoices</label>
          <strong>{issuedInvoices.length}</strong>
          <small>Unpaid invoices visible in your account</small>
        </div>
      </div>
      <div className="portal-overview-analytics">
        <section className="portal-panel" aria-labelledby="customer-progress-title">
          <div className="portal-panel-heading">
            <h2 id="customer-progress-title">Delivery at a glance</h2>
            <Link href="/portal/analytics">Full analytics ↗</Link>
          </div>
          <div className="portal-overview-progress-body">
            <div
              className="portal-overview-progress-ring"
              role="img"
              aria-label={
                delivery.taskPercent === null
                  ? "No tasks recorded yet"
                  : delivery.taskPercent + " percent of visible tasks completed"
              }
              style={{
                background: `conic-gradient(#5d51d4 0 ${delivery.taskPercent ?? 0}%, #e9e8ef ${delivery.taskPercent ?? 0}% 100%)`
              }}
            >
              <div>
                <strong>
                  {delivery.taskPercent === null ? "—" : delivery.taskPercent + "%"}
                </strong>
                <span>Tasks complete</span>
              </div>
            </div>
            <div className="portal-overview-progress-stats">
              <div>
                <span>Completed tasks</span>
                <strong>
                  {delivery.tasksDone} / {data.tasks.length}
                </strong>
              </div>
              <div>
                <span>Completed milestones</span>
                <strong>
                  {delivery.milestonesDone} / {data.milestones.length}
                </strong>
              </div>
              <div>
                <span>Blocked tasks</span>
                <strong>{delivery.blocked}</strong>
              </div>
            </div>
          </div>
          <p className="portal-overview-note">
            Completion is calculated from recorded tasks, not estimated hours or
            fabricated percentages.
          </p>
        </section>
        <section className="portal-panel" aria-labelledby="customer-upcoming-title">
          <div className="portal-panel-heading">
            <h2 id="customer-upcoming-title">Next 30 days</h2>
            <Link href="/portal/calendar">Open calendar ↗</Link>
          </div>
          {delivery.upcoming.length === 0 ? (
            <p className="portal-overview-note">
              No open tasks or milestones have confirmed dates in the next 30 days.
            </p>
          ) : (
            <div className="portal-overview-upcoming">
              {delivery.upcoming.slice(0, 5).map((item) => (
                <div
                  key={item.kind + item.id}
                  className="portal-overview-upcoming-item"
                >
                  <time dateTime={item.dueDate?.toISOString().slice(0, 10)}>
                    {item.dueDate?.toLocaleDateString("en-AU", {
                      day: "2-digit",
                      month: "short",
                      timeZone: "UTC"
                    })}
                  </time>
                  <div>
                    <Link href={"/portal/projects/" + item.engagement.id}>
                      {item.title}
                    </Link>
                    <small>
                      {item.engagement.title} · {item.kind}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="portal-grid">
        <section className="portal-panel">
          <div className="portal-panel-heading">
            <h2>Current engagements</h2>
            <Link href="/portal/projects">All projects ↗</Link>
          </div>
          {data.engagements.length === 0 ? (
            <PortalEmpty
              title="No projects assigned yet"
              description="When your studio engagement is created, its timeline and milestones will appear here."
            />
          ) : (
            data.engagements.slice(0, 5).map((project) => {
              const milestones = data.milestones.filter(
                (item) => item.engagement.id === project.id
              );
              const complete = milestones.filter(
                (item) => item.status === "COMPLETE" || item.status === "APPROVED"
              ).length;
              return (
                <div className="portal-row" key={project.id}>
                  <div className="portal-row-main" style={{ flex: 1 }}>
                    <Link href={"/portal/projects/" + project.id}>{project.title}</Link>
                    <small>
                      {project.workspace.name} ·{" "}
                      {milestones.length === 0
                        ? "No milestones scheduled"
                        : complete +
                          " of " +
                          milestones.length +
                          " milestones complete"}
                    </small>
                    {milestones.length > 0 ? (
                      <div className="portal-progress">
                        <span
                          style={{ width: (complete / milestones.length) * 100 + "%" }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <span className="portal-tag">
                    {clientReadableStatus(project.status)}
                  </span>
                </div>
              );
            })
          )}
        </section>
        <section className="portal-panel portal-panel--ink">
          <div className="portal-panel-heading">
            <h2>Next milestones</h2>
            <Link href="/portal/calendar">Calendar ↗</Link>
          </div>
          {pendingMilestones.length === 0 ? (
            <PortalEmpty
              title="No upcoming milestones"
              description="Confirmed project dates will appear here."
            />
          ) : (
            pendingMilestones.slice(0, 6).map((milestone) => (
              <div className="portal-row portal-row--ink" key={milestone.id}>
                <div className="portal-row-main">
                  <Link href={"/portal/projects/" + milestone.engagement.id}>
                    {milestone.title}
                  </Link>
                  <small>
                    {milestone.engagement.title} ·{" "}
                    {milestone.dueDate
                      ? milestone.dueDate.toLocaleDateString("en-AU")
                      : "Date to be confirmed"}
                  </small>
                </div>
                <span className="portal-tag">
                  {clientReadableStatus(milestone.status)}
                </span>
              </div>
            ))
          )}
        </section>
      </div>
      <div className="portal-grid">
        <section className="portal-panel">
          <div className="portal-panel-heading">
            <h2>Studio updates</h2>
            <Link href="/portal/updates">All updates ↗</Link>
          </div>
          {data.updates.length === 0 ? (
            <PortalEmpty
              title="No published updates"
              description="Progress notes from the delivery team will appear here."
            />
          ) : (
            data.updates.slice(0, 4).map((update) => (
              <div className="portal-row" key={update.id}>
                <div className="portal-row-main">
                  <strong>{update.title}</strong>
                  <small>
                    {update.engagement.title} ·{" "}
                    {update.publishedAt?.toLocaleDateString("en-AU")}
                  </small>
                </div>
              </div>
            ))
          )}
        </section>
        <section className="portal-panel">
          <div className="portal-panel-heading">
            <h2>Your invoices</h2>
            <Link href="/portal/invoices">All invoices ↗</Link>
          </div>
          {data.invoices.length === 0 ? (
            <PortalEmpty
              title="No invoices available"
              description="Issued invoices for your engagements will appear here."
            />
          ) : (
            data.invoices.slice(0, 5).map((invoice) => (
              <div className="portal-row" key={invoice.id}>
                <div className="portal-row-main">
                  <strong>{invoice.reference}</strong>
                  <small>{invoice.engagement.title}</small>
                </div>
                <span className="portal-tag">
                  {clientReadableStatus(invoice.status)}
                </span>
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}
