import { headers } from "next/headers";
import Link from "next/link";

import { requireRole } from "@/modules/auth/server/authorization";
import { getClientCalendarData } from "@/modules/portal/server/client-calendar-data";
import { PortalHeader } from "@/modules/portal/ui/PortalShell";
import { ScheduleBoard, type ScheduleItem } from "@/modules/portal/ui/ScheduleBoard";

export const dynamic = "force-dynamic";

export default async function ClientCalendarPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string; view?: string; date?: string }>;
}): Promise<React.JSX.Element> {
  const principal = await requireRole(await headers(), "client");
  const params = await searchParams;
  const requested = params.month;
  const view = params.view === "month" ? "month" : "week";
  const month =
    typeof requested === "string" && /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(requested)
      ? requested
      : new Date().toISOString().slice(0, 7);

  const data = await getClientCalendarData(principal.userId, month);
  const events: ScheduleItem[] = [
    ...data.milestones
      .filter((item) => item.dueDate !== null)
      .map((item) => ({
        id: "milestone-" + item.id,
        title: item.title,
        date: item.dueDate?.toISOString().slice(0, 10) ?? "",
        context: item.engagement.title + " · Milestone",
        kind: "milestone" as const,
        href: "/portal/projects/" + item.engagement.id
      })),
    ...data.tasks
      .filter((item) => item.dueDate !== null)
      .map((item) => ({
        id: "task-" + item.id,
        title: item.title,
        date: item.dueDate?.toISOString().slice(0, 10) ?? "",
        context: item.engagement.title + " · Task",
        kind: "task" as const,
        href: "/portal/projects/" + item.engagement.id
      })),
    ...data.decisions
      .filter((item) => item.dueDate !== null)
      .map((item) => ({
        id: "approval-" + item.id,
        title: item.title + " · Response requested",
        date: item.dueDate?.toISOString().slice(0, 10) ?? "",
        context: item.engagement.title + " · Customer decision",
        kind: "approval" as const,
        href: "/portal/projects/" + item.engagement.id + "#approvals"
      })),
    ...data.engagements
      .filter((project) => project.targetDate !== null)
      .map((project) => ({
        id: "project-" + project.id,
        title: project.title + " · Target",
        date: project.targetDate?.toISOString().slice(0, 10) ?? "",
        context: project.workspace.name + " · Project target",
        kind: "project" as const,
        href: "/portal/projects/" + project.id
      }))
  ];
  const monthly = events.filter((event) => event.date.startsWith(month));
  const scheduled = (kind: ScheduleItem["kind"]) =>
    monthly.filter((event) => event.kind === kind).length;

  return (
    <>
      <PortalHeader
        eyebrow=""
        title="Your project calendar."
        description="Know what is planned, what is due and which project each date belongs to. All dates are taken from your workspace records."
        action={<Link href="/portal/projects">View your projects ↗</Link>}
      />
      <div className="portal-stat-row portal-calendar-stats">
        <div className="portal-stat portal-stat--ink">
          <label>Milestones this month</label>
          <strong>{scheduled("milestone")}</strong>
          <small>Recorded delivery checkpoints</small>
        </div>
        <div className="portal-stat portal-stat--lilac">
          <label>Tasks this month</label>
          <strong>{scheduled("task")}</strong>
          <small>Work with a confirmed due date</small>
        </div>
        <div className="portal-stat portal-stat--blue">
          <label>Approvals due</label>
          <strong>{scheduled("approval")}</strong>
          <small>Open requests with dated responses</small>
        </div>
        <div className="portal-stat">
          <label>Project targets</label>
          <strong>{scheduled("project")}</strong>
          <small>Current planned completion dates</small>
        </div>
      </div>
      <ScheduleBoard
        month={month}
        view={view}
        selectedDate={params.date}
        path="/portal/calendar"
        items={events}
        title="Delivery schedule"
        description="Browse by month. Select any event to open its project and view the full context."
      />
    </>
  );
}
