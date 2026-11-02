import Link from "next/link";

export type ScheduleItem = Readonly<{
  id: string;
  date: string;
  title: string;
  context: string;
  kind: "milestone" | "task" | "enquiry" | "project";
  href: string;
}>;

export type ScheduleView = "month" | "week";

type ScheduleBoardProps = Readonly<{
  month: string;
  path: string;
  items: ReadonlyArray<ScheduleItem>;
  title?: string;
  description?: string;
  view?: ScheduleView;
  selectedDate?: string;
}>;

function offsetMonth(month: string, offset: number): string {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1;
  return new Date(Date.UTC(year, index + offset, 1)).toISOString().slice(0, 7);
}

function shiftDate(date: string, offset: number): string {
  const value = new Date(date + "T00:00:00.000Z");
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const value = new Date(date + "T00:00:00.000Z");
  return !Number.isNaN(value.getTime()) && value.toISOString().slice(0, 10) === date;
}

function daysInWeek(date: string): string[] {
  const day = new Date(date + "T00:00:00.000Z").getUTCDay();
  const mondayOffset = (day + 6) % 7;
  return Array.from({ length: 7 }, (_, index) => shiftDate(date, index - mondayOffset));
}

function daysInMonth(month: string): Array<string | null> {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1;
  const start = new Date(Date.UTC(year, index, 1));
  const preceding = (start.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  const dates: Array<string | null> = [
    ...Array.from({ length: preceding }, () => null),
    ...Array.from({ length: count }, (_, day) =>
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
  description = "Dated work and decisions, connected directly to their source records.",
  view = "week",
  selectedDate
}: ScheduleBoardProps): React.JSX.Element {
  const today = new Date().toISOString().slice(0, 10);
  const anchor =
    selectedDate && isValidDate(selectedDate) && selectedDate.startsWith(month)
      ? selectedDate
      : month === today.slice(0, 7)
        ? today
        : month + "-01";
  const weekDates = daysInWeek(anchor);
  const start = new Date(month + "-01T00:00:00.000Z");
  const monthName = new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(start);
  const dateFormat = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  });
  const dayLabel = new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC"
  });
  const weekLabel =
    dateFormat.format(new Date(weekDates[0] + "T00:00:00.000Z")) +
    " – " +
    dateFormat.format(new Date(weekDates[6] + "T00:00:00.000Z"));
  const displayed = items
    .filter((item) =>
      view === "week" ? weekDates.includes(item.date) : item.date.startsWith(month)
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  const byDay = new Map<string, ScheduleItem[]>();
  for (const item of displayed) {
    const previous = byDay.get(item.date) ?? [];
    previous.push(item);
    byDay.set(item.date, previous);
  }
  const activeKinds = kinds.filter((kind) =>
    displayed.some((item) => item.kind === kind.key)
  );
  const hrefFor = (focusMonth: string, focusView: ScheduleView, day?: string) =>
    path + "?month=" + focusMonth + "&view=" + focusView + (day ? "&date=" + day : "");
  const previousDay = shiftDate(anchor, -7);
  const nextDay = shiftDate(anchor, 7);
  const previousHref =
    view === "week"
      ? hrefFor(previousDay.slice(0, 7), view, previousDay)
      : hrefFor(offsetMonth(month, -1), view);
  const nextHref =
    view === "week"
      ? hrefFor(nextDay.slice(0, 7), view, nextDay)
      : hrefFor(offsetMonth(month, 1), view);

  return (
    <section className="schedule-shell" aria-label={title}>
      <header className="schedule-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="schedule-controls">
          <nav className="schedule-view-switcher" aria-label="Calendar view">
            <Link
              href={hrefFor(month, "week", anchor)}
              aria-current={view === "week" ? "page" : undefined}
            >
              Week
            </Link>
            <Link
              href={hrefFor(month, "month")}
              aria-current={view === "month" ? "page" : undefined}
            >
              Month
            </Link>
          </nav>
          <div className="schedule-month-switcher" aria-label="Calendar dates">
            <Link href={previousHref} aria-label={view === "week" ? "Previous week" : "Previous month"}>
              ←
            </Link>
            <strong>{view === "week" ? weekLabel : monthName}</strong>
            <Link href={nextHref} aria-label={view === "week" ? "Next week" : "Next month"}>
              →
            </Link>
          </div>
          <Link className="schedule-today" href={hrefFor(today.slice(0, 7), view, today)}>
            Today
          </Link>
        </div>
      </header>

      <div className="schedule-legend" aria-label="Event types">
        {activeKinds.length === 0 ? (
          <span className="schedule-subtle">
            No scheduled items {view === "week" ? "this week" : "this month"}
          </span>
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
          {view === "week" ? (
            <div className="schedule-week-grid" role="group" aria-label={weekLabel + " calendar"}>
              {weekDates.map((date) => {
                const events = byDay.get(date) ?? [];
                const fullDate = new Date(date + "T00:00:00.000Z");
                return (
                  <div
                    className={
                      "schedule-week-cell" +
                      (date === today ? " schedule-week-cell--today" : "") +
                      (date.slice(0, 7) !== month ? " schedule-week-cell--adjacent" : "")
                    }
                    key={date}
                  >
                    <div className="schedule-week-cell-header">
                      <time dateTime={date}>
                        <span>{new Intl.DateTimeFormat("en-AU", { weekday: "short", timeZone: "UTC" }).format(fullDate)}</span>
                        <strong>{Number(date.slice(8, 10))}</strong>
                      </time>
                      <span className="schedule-week-count">
                        {events.length === 0 ? "Clear" : events.length + (events.length === 1 ? " item" : " items")}
                      </span>
                    </div>
                    <div className="schedule-week-events">
                      {events.length === 0 ? (
                        <p className="schedule-week-empty">No recorded dates</p>
                      ) : (
                        events.map((event) => (
                          <Link
                            key={event.id}
                            href={event.href}
                            className={"schedule-week-event schedule-week-event--" + event.kind}
                          >
                            <strong>{event.title}</strong>
                            <small>{event.context}</small>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="schedule-calendar" role="group" aria-label={monthName + " calendar"}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div className="schedule-weekday" key={day}>{day}</div>
              ))}
              {daysInMonth(month).map((date, index) => {
                if (!date) {
                  return <div className="schedule-day schedule-day--outside" aria-hidden="true" key={"empty-" + index} />;
                }
                const events = byDay.get(date) ?? [];
                const fullDate = new Date(date + "T00:00:00.000Z");
                return (
                  <div
                    className={"schedule-day" + (date === today ? " schedule-day--today" : "")}
                    key={date}
                    aria-label={dayLabel.format(fullDate) + ", " + events.length + " scheduled items"}
                  >
                    <time dateTime={date} className="schedule-date">{Number(date.slice(8, 10))}</time>
                    <div className="schedule-day-events">
                      {events.slice(0, 2).map((event) => (
                        <Link
                          key={event.id}
                          href={event.href}
                          aria-label={event.title + ", " + event.context}
                          className={"schedule-event schedule-event--" + event.kind}
                        >
                          {event.title}
                        </Link>
                      ))}
                      {events.length > 2 ? (
                        <details className="schedule-overflow">
                          <summary>+{events.length - 2} more</summary>
                          {events.slice(2).map((event) => (
                            <Link
                              key={event.id}
                              href={event.href}
                              className={"schedule-event schedule-event--" + event.kind}
                            >
                              {event.title}
                            </Link>
                          ))}
                        </details>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <aside className="schedule-agenda" aria-label={view === "week" ? "Weekly schedule" : "Monthly schedule"}>
          <div className="schedule-agenda-heading">
            <h3>{view === "week" ? "This week" : "This month"}</h3>
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
                    {dateFormat.format(new Date(event.date + "T00:00:00.000Z"))}
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
