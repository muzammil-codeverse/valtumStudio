import { headers } from "next/headers";
import Link from "next/link";

import { requireRole } from "@/modules/auth/server/authorization";
import { getClientDashboard } from "@/modules/portal/server/client-data";
import { PortalEmpty, PortalHeader } from "@/modules/portal/ui/PortalShell";

export const dynamic = "force-dynamic";

export default async function ClientCalendarPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string }>;
}): Promise<React.JSX.Element> {
  const principal = await requireRole(await headers(), "client");
  const data = await getClientDashboard(principal.userId);
  const requested = (await searchParams).month;
  const now = new Date();
  const month =
    requested && /^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(requested)
      ? requested
      : now.toISOString().slice(0, 7);
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const blanks = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const entries = [
    ...data.milestones.filter((item) => item.dueDate).map((item) => ({
      id: item.id,
      title: item.title,
      date: item.dueDate?.toISOString().slice(0, 10) ?? "",
      project: item.engagement.title,
      projectId: item.engagement.id,
      type: "Milestone"
    })),
    ...data.tasks.filter((item) => item.dueDate).map((item) => ({
      id: item.id,
      title: item.title,
      date: item.dueDate?.toISOString().slice(0, 10) ?? "",
      project: item.engagement.title,
      projectId: item.engagement.id,
      type: "Task"
    }))
  ];
  const current = entries.filter((item) => item.date.startsWith(month));
  const monthLabel = new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(first);
  const prev = new Date(Date.UTC(year, monthIndex - 1, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(year, monthIndex + 1, 1)).toISOString().slice(0, 7);
  return (
    <>
      <PortalHeader eyebrow="DELIVERY / SCHEDULE" title="The delivery calendar." description="Confirmed milestone and task due dates across your authorized projects." />
      <section className="portal-panel">
        <div className="portal-panel-heading">
          <h2>{monthLabel}</h2>
          <div style={{ display: "flex", gap: 9 }}>
            <Link className="portal-link-pill" href={"/portal/calendar?month=" + prev}>← Previous</Link>
            <Link className="portal-link-pill" href={"/portal/calendar?month=" + next}>Next →</Link>
          </div>
        </div>
        <div className="portal-calendar-grid">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span className="portal-calendar-week" key={day}>{day}</span>)}
          {Array.from({ length: blanks }, (_, i) => <div className="portal-calendar-cell portal-calendar-cell--blank" key={"blank" + i} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(Date.UTC(year, monthIndex, i + 1)).toISOString().slice(0, 10);
            const items = current.filter((entry) => entry.date === date);
            return (
              <div className="portal-calendar-cell" key={date} title={date + ": " + items.length + " scheduled items"}>
                <strong>{i + 1}</strong>
                {items.slice(0, 2).map((item) => <span className="portal-calendar-event" key={item.type + item.id}>{item.title}</span>)}
                {items.length > 2 ? <small>+{items.length - 2} more</small> : null}
              </div>
            );
          })}
        </div>
      </section>
      <section className="portal-panel" style={{ marginTop: 18 }}>
        <div className="portal-panel-heading"><h2>Scheduled this month</h2><span className="portal-tag">{current.length} items</span></div>
        {current.length === 0 ? <PortalEmpty title="No deadlines scheduled" description="There are no published task or milestone due dates for this month." /> : current.sort((a, b) => a.date.localeCompare(b.date)).map((item) => (
          <div className="portal-row" key={item.type + item.id}>
            <div className="portal-row-main">
              <Link href={"/portal/projects/" + item.projectId}>{item.title}</Link>
              <small>{item.type} · {item.project}</small>
            </div>
            <span className="portal-tag">{item.date}</span>
          </div>
        ))}
      </section>
    </>
  );
}
