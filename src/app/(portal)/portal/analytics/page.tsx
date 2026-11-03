import { headers } from "next/headers";
import Link from "next/link";

import { requireRole } from "@/modules/auth/server/authorization";
import {
  clientReadableStatus,
  formatClientMoney,
  getClientDashboard
} from "@/modules/portal/server/client-data";
import { getClientBillingInsights } from "@/modules/portal/server/delivery-billing";
import { getClientDeliveryMetrics } from "@/modules/portal/server/delivery-metrics";
import { PortalEmpty, PortalHeader } from "@/modules/portal/ui/PortalShell";

export const dynamic = "force-dynamic";

export default async function ClientAnalyticsPage(): Promise<React.JSX.Element> {
  const principal = await requireRole(await headers(), "client");
  const [data, insight, invoices] = await Promise.all([
    getClientDashboard(principal.userId),
    getClientDeliveryMetrics(principal.userId),
    getClientBillingInsights(principal.userId)
  ]);
  const hasWork = data.engagements.length > 0;
  const dateFormat = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  });
  return (
    <>
      <PortalHeader
        eyebrow="WORKSPACE / INTELLIGENCE"
        title="Your project intelligence."
        description="A transparent view of tasks, milestones, delivery dates and issued invoices, measured only from your workspace records."
        action={<Link href="/portal/calendar">View delivery calendar ↗</Link>}
      />
      {!hasWork ? (
        <PortalEmpty
          title="No project activity to report yet"
          description="Delivery analytics will appear after the studio assigns a project to your account."
        />
      ) : (
        <>
          <div className="portal-insight-kpis">
            <section className="portal-insight-kpi portal-insight-kpi--dark">
              <span>Active projects</span>
              <strong>{insight.active}</strong>
              <small>Engagements currently active or in review</small>
            </section>
            <section className="portal-insight-kpi portal-insight-kpi--lilac">
              <span>Tasks completed</span>
              <strong>
                {insight.tasksDone}
                <i> / {insight.taskTotal}</i>
              </strong>
              <small>
                {insight.taskPercent === null
                  ? "No tasks recorded"
                  : insight.taskPercent + "% of visible tasks"}
              </small>
            </section>
            <section className="portal-insight-kpi portal-insight-kpi--coral">
              <span>Milestones completed</span>
              <strong>
                {insight.milestonesDone}
                <i> / {insight.milestoneTotal}</i>
              </strong>
              <small>
                {insight.milestonePercent === null
                  ? "No milestones recorded"
                  : insight.milestonePercent + "% approved or completed"}
              </small>
            </section>
            <section className="portal-insight-kpi portal-insight-kpi--blue">
              <span>Tasks blocked</span>
              <strong>{insight.blocked}</strong>
              <small>Items marked as needing attention</small>
            </section>
          </div>
          <div className="portal-insight-layout">
            <section className="portal-panel portal-insight-progress">
              <div className="portal-panel-heading">
                <div>
                  <span className="portal-kicker">DELIVERY / STATUS</span>
                  <h2>Completion snapshot</h2>
                </div>
                <span className="portal-tag">Recorded tasks</span>
              </div>
              <div className="portal-insight-progress-body">
                <div
                  className="portal-insight-ring"
                  role="img"
                  aria-label={
                    insight.taskPercent === null
                      ? "No tasks recorded"
                      : insight.taskPercent + " percent of recorded tasks completed"
                  }
                  style={{
                    background: `conic-gradient(#5c51d5 0% ${insight.taskPercent ?? 0}%, #e8e7f1 ${insight.taskPercent ?? 0}% 100%)`
                  }}
                >
                  <div>
                    <strong>
                      {insight.taskPercent === null ? "—" : insight.taskPercent + "%"}
                    </strong>
                    <small>Tasks done</small>
                  </div>
                </div>
                <div className="portal-insight-progress-detail">
                  <p>
                    Delivery moves through clearly recorded milestones and tasks, not
                    invented progress estimates.
                  </p>
                  <div>
                    <span>Tasks</span>
                    <strong>
                      {insight.tasksDone} of {insight.taskTotal}
                    </strong>
                  </div>
                  <div>
                    <span>Milestones</span>
                    <strong>
                      {insight.milestonesDone} of {insight.milestoneTotal}
                    </strong>
                  </div>
                  <div>
                    <span>Currently blocked</span>
                    <strong>{insight.blocked}</strong>
                  </div>
                </div>
              </div>
            </section>
            <section className="portal-panel portal-insight-schedule">
              <div className="portal-panel-heading">
                <div>
                  <span className="portal-kicker">DELIVERY / PLANNING</span>
                  <h2>Recorded deadlines</h2>
                </div>
                <span className="portal-tag">Last six months</span>
              </div>
              <div
                className="portal-insight-bars"
                role="img"
                aria-label={
                  "Tasks and milestones due by month: " +
                  insight.months.map((m) => m.label + " " + m.count).join(", ")
                }
              >
                {insight.months.map((month) => (
                  <div key={month.key} className="portal-insight-bar">
                    <span>{month.count}</span>
                    <div className="portal-insight-bar-track">
                      <div
                        style={{
                          height: `${month.count === 0 ? 0 : Math.max(8, (month.count / insight.monthMax) * 100)}%`
                        }}
                      />
                    </div>
                    <small>{month.label}</small>
                  </div>
                ))}
              </div>
              <p className="portal-insight-note">
                Deadline distribution, not hours worked. Only accessible records are
                included.
              </p>
            </section>
          </div>
          <div className="portal-insight-layout portal-insight-layout--secondary">
            <section className="portal-panel">
              <div className="portal-panel-heading">
                <div>
                  <span className="portal-kicker">ENGAGEMENTS</span>
                  <h2>Project health</h2>
                </div>
                <Link href="/portal/projects">All projects ↗</Link>
              </div>
              <div className="portal-insight-projects">
                {insight.projects.map((project) => (
                  <div key={project.id} className="portal-insight-project">
                    <div className="portal-insight-project-heading">
                      <Link href={"/portal/projects/" + project.id}>
                        {project.title}
                      </Link>
                      <span className="portal-tag">
                        {clientReadableStatus(project.status)}
                      </span>
                    </div>
                    <div
                      className="portal-insight-meter"
                      role="img"
                      aria-label={
                        project.percent === null
                          ? "No tasks yet"
                          : project.percent + "% tasks completed"
                      }
                    >
                      <span style={{ width: `${project.percent ?? 0}%` }} />
                    </div>
                    <small>
                      {project.tasksDone} / {project.taskCount} visible tasks complete
                    </small>
                  </div>
                ))}
              </div>
            </section>
            <section className="portal-panel">
              <div className="portal-panel-heading">
                <div>
                  <span className="portal-kicker">NEXT 30 DAYS</span>
                  <h2>What&apos;s coming up</h2>
                </div>
                <Link href="/portal/calendar">Calendar ↗</Link>
              </div>
              {insight.upcoming.length === 0 ? (
                <p className="portal-insight-note">
                  No open deadlines have been scheduled in the next 30 days.
                </p>
              ) : (
                <div className="portal-insight-upcoming">
                  {insight.upcoming.map((item) => (
                    <div key={item.kind + item.id}>
                      <div className="portal-insight-date">
                        {item.dueDate ? dateFormat.format(item.dueDate) : "—"}
                      </div>
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
          <section className="portal-panel portal-insight-billing">
            <div className="portal-panel-heading">
              <div>
                <span className="portal-kicker">BILLING / ISSUED ONLY</span>
                <h2>Invoice summary</h2>
              </div>
              <Link href="/portal/invoices">View invoices ↗</Link>
            </div>
            {invoices.length === 0 ? (
              <p className="portal-insight-note">
                No invoices have been issued for your projects.
              </p>
            ) : (
              <div className="portal-insight-billing-grid">
                {invoices.map((currency) => (
                  <div key={currency.currency}>
                    <span>
                      {currency.currency} · {currency.invoiceCount} invoices
                    </span>
                    <strong>
                      {formatClientMoney(currency.totalCents, currency.currency)}
                    </strong>
                    <div>
                      <small>Paid</small>
                      <b>{formatClientMoney(currency.paidCents, currency.currency)}</b>
                    </div>
                    <div>
                      <small>Outstanding</small>
                      <b>
                        {formatClientMoney(
                          currency.outstandingCents,
                          currency.currency
                        )}
                      </b>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
