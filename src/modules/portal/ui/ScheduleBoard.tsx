import Link from "next/link";

export type ScheduleItem = Readonly<{
  id: string;
  date: string;
  title: string;
  context: string;
  kind: "milestone" | "task" | "enquiry" | "project";
  href: string;
}>;

type ScheduleBoardProps = Readonly<{
  month: string;
  path: string;
  items: ReadonlyArray<ScheduleItem>;
  title?: string;
  description?: string;
}>;

function offsetMonth(month: string, offset: number): string {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1;
  return new Date(Date.UTC(year, index + offset, 1)).toISOString().slice(0, 7);
}

function daysInView(month: string): Array<string | null> {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1;
  const start = new Date(Date.UTC(year, index, 1));
  const preceding = (start.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  const dates: Array<string | null> = [
    ...Array.from({ length: preceding }, () => null),
    ...Array.from({ length: days }, (_, day) =>
      new Date(Date.UTC(year, index, day + 1)).toISOString().slice(0, 10)
    )
  ];
  while (dates.length % 7 !== 0) dates.push(null);
  return dates;
}

const kinds = [
  { key: "milestone", label: "Milestones" },
  { key: "task", label: "Tasks" },
  { key: "project", label: "Project targets" },
  { key: "enquiry", label: "Enquiries" }
] as const;

export function ScheduleBoard({
  month,
  path,
  items,
  title = "Project calendar",
  description = "Dated work and decisions, connected directly to their source records."
}: ScheduleBoardProps): React.JSX.Element {
  const start = new Date(month + "-01T00:00:00.000Z");
  const monthName = new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(start);
  const dayLabel = new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC"
  });
  const today = new Date().toISOString().slice(0, 10);
  const displayed = items
    .filter((item) => item.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  const byDay = new Map<string, ScheduleItem[]>();
  for (const item of displayed) {
    const current = byDay.get(item.date) ?? [];
    current.push(item);
    byDay.set(item.date, current);
  }
  const activeKinds = kinds.filter((kind) =>
    displayed.some((item) => item.kind === kind.key)
  );

  return (
    <section className="schedule-shell" aria-label={title}>
      <header className="schedule-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="schedule-month-switcher" aria-label="Calendar month">
          <Link href={path + "?month=" + offsetMonth(month, -1)} aria-label="Previous month">←</Link>
          <strong>{monthName}</strong>
          <Link href={path + "?month=" + offsetMonth(month, 1)} aria-label="Next month">→</Link>
        </div>
      </header>
      <div className="schedule-legend" aria-label="Event types">
        {activeKinds.length === 0 ? (
          <span className="schedule-subtle">No scheduled items for this month</span>
        ) : (
          activeKinds.map((kind) => (
            <span key={kind.key} className="schedule-legend-item">
              <i className={"schedule-indicator schedule-indicator--" + kind.key} aria-hidden="true" />
              {kind.label}
            </span>
          ))
        )}
      </div>
      <div className="schedule-columns">
        <div className="schedule-calendar-scroll">
          <div className="schedule-calendar" role="group" aria-label={monthName + " calendar"}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div className="schedule-weekday" key={day}>{day}</div>
            ))}
            {daysInView(month).map((date, index) => {
              if (!date) {
                return <div className="schedule-day schedule-day--outside" aria-hidden="true" key={"empty-" + index} />;
              }
              const events = byDay.get(date) ?? [];
              const calendarDate = new Date(date + "T00:00:00.000Z");
              return (
                <div
                  className={"schedule-day" + (date === today ? " schedule-day--today" : "")}
                  key={date}
                  aria-label={dayLabel.format(calendarDate) + ", " + events.length + " scheduled items"}
                >
                  <time dateTime={date} className="schedule-date">{Number(date.slice(8, 10))}</time>
                  <div className="schedule-day-events">
                    {events.slice(0, 2).map((event) => (
                      <Link
                        key={event.id}
                        href={event.href}
                        title={event.title + " · " + event.context}
                        className={"schedule-event schedule-event--" + event.kind}
                      >
                        {event.title}
                      </Link>
                    ))}
                    {events.length > 2 && (
                      <span className="schedule-more">+{events.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <aside className="schedule-agenda" aria-label="Monthly schedule">
          <div className="schedule-agenda-heading">
            <h3>On the schedule</h3>
            <span>{displayed.length} {displayed.length === 1 ? "item" : "items"}</span>
          </div>
          <div className="schedule-agenda-body">
            {displayed.length === 0 ? (
              <div className="schedule-no-events">
                <strong>Nothing scheduled yet.</strong>
                <p>Tasks, milestones and confirmed dates appear as they are recorded.</p>
              </div>
            ) : (
              displayed.map((event) => (
                <div className="schedule-agenda-event" key={event.id}>
                  <span className={"schedule-agenda-date schedule-agenda-date--" + event.kind}>
                    {new Intl.DateTimeFormat("en-AU", {
                      day: "2-digit",
                      month: "short",
                      timeZone: "UTC"
                    }).format(new Date(event.date + "T00:00:00.000Z"))}
                  </span>
                  <div>
                    <Link href={event.href}>{event.title}</Link>
                    <small>{event.context}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
