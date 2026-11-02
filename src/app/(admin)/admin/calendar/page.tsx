import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { prisma } from "@/lib/database";
import {
  fetchDashboardInsight,
  parseDashboardMonth
} from "@/modules/admin/server/overview-insights";
import { can } from "@/modules/auth/policies/authorization";
import { requirePermission } from "@/modules/auth/server/authorization";
import { isClientPortalEnabled } from "@/modules/portal/server/client-data";
import { ScheduleBoard, type ScheduleItem } from "@/modules/portal/ui/ScheduleBoard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Studio Calendar | Valtum Studio",
  robots: { index: false }
};

export default async function CalendarPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string; view?: string; date?: string }>;
}): Promise<React.JSX.Element> {
  const principal = await requirePermission(await headers(), "leads", "read");
  const params = await searchParams;
  const month = parseDashboardMonth(params.month);
  const view = params.view === "month" ? "month" : "week";
  const insight = await fetchDashboardInsight(principal.role, month);
  const monthStart = new Date(month + "-01T00:00:00.000Z");
  const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
  const requestedDate = params.date;
  const today = new Date().toISOString().slice(0, 10);
  const selectedDay =
    requestedDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) &&
    !Number.isNaN(Date.parse(requestedDate + "T00:00:00.000Z")) &&
    new Date(requestedDate + "T00:00:00.000Z").toISOString().slice(0, 10) === requestedDate &&
    requestedDate.startsWith(month)
      ? requestedDate
      : month === today.slice(0, 7) ? today : month + "-01";
  const weekStart = new Date(selectedDay + "T00:00:00.000Z");
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const start = view === "week" ? new Date(Math.min(monthStart.getTime(), weekStart.getTime())) : monthStart;
  const end = view === "week" ? new Date(Math.max(monthEnd.getTime(), weekEnd.getTime())) : monthEnd;
  const includeDelivery =
    isClientPortalEnabled() &&
    can(principal.role, { resource: "clients", action: "read" });

  const [milestones, tasks, projects] = includeDelivery
    ? await Promise.all([
        prisma.clientMilestone.findMany({
          where: { dueDate: { gte: start, lt: end } },
          select: {
            id: true, title: true, dueDate: true,
            engagement: { select: { id: true, title: true } }
          },
          orderBy: { dueDate: "asc" },
          take: 300
        }),
        prisma.clientTask.findMany({
          where: { dueDate: { gte: start, lt: end } },
          select: {
            id: true, title: true, dueDate: true,
            engagement: { select: { id: true, title: true } }
          },
          orderBy: { dueDate: "asc" },
          take: 300
        }),
        prisma.clientEngagement.findMany({
          where: { targetDate: { gte: start, lt: end } },
          select: { id: true, title: true, targetDate: true, workspace: { select: { name: true } } },
          orderBy: { targetDate: "asc" },
          take: 100
        })
      ])
    : [[], [], []];

  const leadDates = await prisma.lead.groupBy({
    by: ["createdAt"],
    where: { archivedAt: null, createdAt: { gte: start, lt: end } },
    _count: { _all: true }
  });
  const dailyCounts: Record<string, number> = {};
  for (const lead of leadDates) {
    const date = lead.createdAt.toISOString().slice(0, 10);
    dailyCounts[date] = (dailyCounts[date] ?? 0) + lead._count._all;
  }

  const events: ScheduleItem[] = [
    ...Object.entries(dailyCounts).map(([date, count]) => ({
      id: "leads-" + date,
      date,
      title: count + (count === 1 ? " new enquiry" : " new enquiries"),
      context: "Lead CRM · Submitted enquiries",
      kind: "enquiry" as const,
      href: "/admin/leads"
    })),
    ...milestones
      .filter((item) => item.dueDate !== null)
      .map((item) => ({
        id: "milestone-" + item.id,
        date: item.dueDate!.toISOString().slice(0, 10),
        title: item.title,
        context: item.engagement.title + " · Milestone",
        kind: "milestone" as const,
        href: "/admin/clients"
      })),
    ...tasks
      .filter((item) => item.dueDate !== null)
      .map((item) => ({
        id: "task-" + item.id,
        date: item.dueDate!.toISOString().slice(0, 10),
        title: item.title,
        context: item.engagement.title + " · Task",
        kind: "task" as const,
        href: "/admin/clients"
      })),
    ...projects
      .filter((item) => item.targetDate !== null)
      .map((item) => ({
        id: "project-" + item.id,
        date: item.targetDate!.toISOString().slice(0, 10),
        title: item.title + " · Target",
        context: item.workspace.name + " · Project target",
        kind: "project" as const,
        href: "/admin/clients"
      }))
  ];

  return (
    <div className="ds-workspace">
      <div className="ds-hero">
        <div>
          <h1>Studio calendar.</h1>
          <p>One operational view for incoming enquiries and confirmed client delivery dates.</p>
        </div>
        <Link href="/admin/leads" className="ds-outline-link">Open the CRM ↗</Link>
      </div>
      <div className="ds-stats schedule-summary">
        <div className="ds-stat ds-stat--dark">
          <span className="ds-stat-top">New enquiries</span>
          <strong>{insight.currentMonthCount}</strong>
          <span className="ds-stat-note">Received during the selected month</span>
        </div>
        <div className="ds-stat ds-stat--lilac">
          <span className="ds-stat-top">Client milestones</span>
          <strong>{milestones.filter((item) => item.dueDate?.toISOString().startsWith(month)).length}</strong>
          <span className="ds-stat-note">Dated checkpoints for the selected month</span>
        </div>
        <div className="ds-stat ds-stat--blue">
          <span className="ds-stat-top">Delivery tasks</span>
          <strong>{tasks.filter((item) => item.dueDate?.toISOString().startsWith(month)).length}</strong>
          <span className="ds-stat-note">Tasks scheduled in the selected month</span>
        </div>
        <div className="ds-stat">
          <span className="ds-stat-top">Project targets</span>
          <strong>{projects.filter((item) => item.targetDate?.toISOString().startsWith(month)).length}</strong>
          <span className="ds-stat-note">Planned project completion dates</span>
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <ScheduleBoard
          month={month}
          view={view}
          selectedDate={params.date}
          path="/admin/calendar"
          items={events}
          title="Operations and delivery"
          description={includeDelivery
            ? "Enquiries, tasks, milestones and project targets are shown from your live records."
            : "Enquiries are shown from your CRM. Client delivery events appear after the secure customer portal is enabled."}
        />
      </div>
    </div>
  );
}
