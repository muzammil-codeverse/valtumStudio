import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import {
  formatClientMoney,
  isClientPortalEnabled
} from "@/modules/portal/server/client-data";

export const dynamic = "force-dynamic";

const projectStatuses = [
  "PLANNING",
  "ACTIVE",
  "REVIEW",
  "COMPLETE",
  "ON_HOLD"
] as const;
const taskStatuses = ["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"] as const;

function readable(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}

export default async function DeliveryAnalyticsPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "clients", "read");
  if (!isClientPortalEnabled()) notFound();

  const now = new Date();
  const horizon = new Date(now.getTime() + 30 * 86400000);
  const [
    workspaces,
    projectGroups,
    taskGroups,
    milestoneGroups,
    invoiceGroups,
    upcomingTasks,
    upcomingMilestones
  ] = await Promise.all([
    prisma.clientWorkspace.count(),
    prisma.clientEngagement.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.clientTask.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.clientMilestone.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.clientInvoice.groupBy({
      by: ["currency", "status"],
      _count: { _all: true },
      _sum: { amountCents: true }
    }),
    prisma.clientTask.findMany({
      where: { dueDate: { gte: now, lt: horizon }, status: { not: "DONE" } },
      select: {
        id: true,
        title: true,
        dueDate: true,
        engagement: { select: { title: true, workspaceId: true } }
      },
      take: 8,
      orderBy: { dueDate: "asc" }
    }),
    prisma.clientMilestone.findMany({
      where: {
        dueDate: { gte: now, lt: horizon },
        status: { notIn: ["APPROVED", "COMPLETE"] }
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        engagement: { select: { title: true, workspaceId: true } }
      },
      take: 8,
      orderBy: { dueDate: "asc" }
    })
  ]);

  const projectTotal = projectGroups.reduce((sum, item) => sum + item._count._all, 0);
  const taskTotal = taskGroups.reduce((sum, item) => sum + item._count._all, 0);
  const tasksDone = taskGroups.find((item) => item.status === "DONE")?._count._all ?? 0;
  const overdueCount =
    taskGroups.find((item) => item.status === "BLOCKED")?._count._all ?? 0;
  const pendingReview =
    milestoneGroups.find((item) => item.status === "AWAITING_REVIEW")?._count._all ?? 0;
  const projectMax = Math.max(1, ...projectGroups.map((item) => item._count._all));
  const taskMax = Math.max(1, ...taskGroups.map((item) => item._count._all));
  const currencies = Array.from(
    new Set(invoiceGroups.map((invoice) => invoice.currency))
  ).sort();
  const schedule = [
    ...upcomingTasks.map((item) => ({ ...item, type: "Task" })),
    ...upcomingMilestones.map((item) => ({ ...item, type: "Milestone" }))
  ]
    .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
    .slice(0, 10);
  const dateFormat = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  });

  return (
    <div className="ds-workspace delivery-admin">
      <div className="ds-hero">
        <div>
          <span className="ds-kicker">STUDIO OPERATIONS / DELIVERY</span>
          <h1>Delivery intelligence.</h1>
          <p>
            Live, aggregated records for customer workspaces, project delivery and
            invoice status.
          </p>
        </div>
        <Link className="ds-outline-link" href="/admin/clients">
          Manage client workspaces ↗
        </Link>
      </div>

      <div className="delivery-admin-kpis">
        <section className="delivery-admin-kpi delivery-admin-kpi--dark">
          <span>Client workspaces</span>
          <strong>{workspaces}</strong>
          <small>Recorded organizations</small>
        </section>
        <section className="delivery-admin-kpi delivery-admin-kpi--lilac">
          <span>Engagements</span>
          <strong>{projectTotal}</strong>
          <small>Across client workspaces</small>
        </section>
        <section className="delivery-admin-kpi delivery-admin-kpi--blue">
          <span>Tasks completed</span>
          <strong>
            {tasksDone}
            <i> / {taskTotal}</i>
          </strong>
          <small>
            {taskTotal
              ? Math.round((tasksDone / taskTotal) * 100) + "% completion"
              : "No tasks recorded"}
          </small>
        </section>
        <section className="delivery-admin-kpi delivery-admin-kpi--coral">
          <span>Attention required</span>
          <strong>{overdueCount + pendingReview}</strong>
          <small>
            {overdueCount} blocked tasks · {pendingReview} milestones awaiting review
          </small>
        </section>
      </div>

      <div className="delivery-admin-columns">
        <section className="ds-panel">
          <div className="ds-block-heading">
            <div>
              <span className="ds-kicker">DELIVERY / PORTFOLIO</span>
              <h2>Engagement stages</h2>
            </div>
            <strong>{projectTotal} total</strong>
          </div>
          <div className="delivery-admin-bars">
            {projectStatuses.map((status) => {
              const count =
                projectGroups.find((row) => row.status === status)?._count._all ?? 0;
              return (
                <div className="delivery-admin-bar-row" key={status}>
                  <div>
                    <span>{readable(status)}</span>
                    <strong>{count}</strong>
                  </div>
                  <div
                    className="delivery-admin-track"
                    role="img"
                    aria-label={readable(status) + ": " + count + " engagements"}
                  >
                    <span style={{ width: `${(count / projectMax) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="delivery-admin-note">
            Counts reflect registered client engagements, not the public portfolio.
          </p>
        </section>
        <section className="ds-panel">
          <div className="ds-block-heading">
            <div>
              <span className="ds-kicker">WORK / EXECUTION</span>
              <h2>Task pipeline</h2>
            </div>
            <strong>{taskTotal} total</strong>
          </div>
          <div className="delivery-admin-bars">
            {taskStatuses.map((status) => {
              const count =
                taskGroups.find((row) => row.status === status)?._count._all ?? 0;
              return (
                <div className="delivery-admin-bar-row" key={status}>
                  <div>
                    <span>{readable(status)}</span>
                    <strong>{count}</strong>
                  </div>
                  <div
                    className="delivery-admin-track delivery-admin-track--blue"
                    role="img"
                    aria-label={readable(status) + ": " + count + " tasks"}
                  >
                    <span style={{ width: `${(count / taskMax) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="delivery-admin-note">
            Blocked work requires operator attention. Nothing is inferred from missing
            time tracking.
          </p>
        </section>
      </div>

      <div className="delivery-admin-columns delivery-admin-columns--bottom">
        <section className="ds-panel">
          <div className="ds-block-heading">
            <div>
              <span className="ds-kicker">NEXT 30 DAYS</span>
              <h2>Upcoming delivery</h2>
            </div>
            <Link className="ds-inline-link" href="/admin/clients">
              Client workspaces ↗
            </Link>
          </div>
          {schedule.length === 0 ? (
            <p className="delivery-admin-note">
              No open tasks or milestones with deadlines in the next 30 days.
            </p>
          ) : (
            <div className="delivery-admin-schedule">
              {schedule.map((item) => (
                <div key={item.type + item.id}>
                  <time>{item.dueDate ? dateFormat.format(item.dueDate) : "—"}</time>
                  <div>
                    <Link href={"/admin/clients/" + item.engagement.workspaceId}>
                      {item.title}
                    </Link>
                    <small>
                      {item.engagement.title} · {item.type}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="ds-panel">
          <div className="ds-block-heading">
            <div>
              <span className="ds-kicker">INVOICING / RECORDED</span>
              <h2>Billing by currency</h2>
            </div>
            <strong>Issued & paid</strong>
          </div>
          {currencies.length === 0 ? (
            <p className="delivery-admin-note">
              No client invoices have been created yet.
            </p>
          ) : (
            <div className="delivery-admin-billing">
              {currencies.map((currency) => {
                const rows = invoiceGroups.filter((row) => row.currency === currency);
                const issued = rows
                  .filter((row) => row.status === "ISSUED")
                  .reduce((sum, row) => sum + (row._sum.amountCents ?? 0), 0);
                const paid = rows
                  .filter((row) => row.status === "PAID")
                  .reduce((sum, row) => sum + (row._sum.amountCents ?? 0), 0);
                const drafts = rows
                  .filter((row) => row.status === "DRAFT")
                  .reduce((sum, row) => sum + row._count._all, 0);
                return (
                  <div key={currency}>
                    <div>
                      <strong>{currency}</strong>
                      <small>{drafts} drafts not included</small>
                    </div>
                    <div>
                      <span>Issued outstanding</span>
                      <b>{formatClientMoney(issued, currency)}</b>
                    </div>
                    <div>
                      <span>Marked paid</span>
                      <b>{formatClientMoney(paid, currency)}</b>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="delivery-admin-note">
            Manual status reporting, not bank reconciliation or confirmed
            payment-provider settlements. Currencies are never combined.
          </p>
        </section>
      </div>
    </div>
  );
}
