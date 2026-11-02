import Link from "next/link";

import type { AdminDashboardSummary } from "@/modules/admin/server/dashboard-queries";
import type { DashboardInsight } from "@/modules/admin/server/overview-insights";

type WorkspaceProps = Readonly<{
  name: string;
  role: string;
  summary: AdminDashboardSummary;
  insight: DashboardInsight;
  databaseReady: boolean;
}>;

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-AU").format(value);
}

function prettyStatus(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}

function StatTile({
  label,
  value,
  note,
  href,
  tone = "neutral"
}: {
  label: string;
  value: number;
  note: string;
  href: string;
  tone?: "neutral" | "lilac" | "blue" | "dark";
}): React.JSX.Element {
  return (
    <Link className={"ds-stat ds-stat--" + tone} href={href}>
      <div className="ds-stat-top">
        <span>{label}</span>
        <span className="ds-stat-arrow" aria-hidden="true">
          ↗
        </span>
      </div>
      <strong>{formatNumber(value)}</strong>
      <span className="ds-stat-note">{note}</span>
    </Link>
  );
}

function BlockHeading({
  title,
  description,
  href,
  linkLabel
}: {
  kicker: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}): React.JSX.Element {
  return (
    <div className="ds-block-heading">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="ds-inline-link">
          {linkLabel ?? "Explore"} <span aria-hidden="true">↗</span>
        </Link>
      ) : null}
    </div>
  );
}

export function LeadVolumeChart({
  insight
}: {
  insight: DashboardInsight;
}): React.JSX.Element {
  const max = Math.max(1, ...insight.trend.map((point) => point.count));
  const allZero = insight.trend.every((point) => point.count === 0);
  return (
    <section className="ds-panel ds-volume">
      <BlockHeading
        kicker="Intelligence / 01"
        title="Enquiry volume"
        description="Real contact enquiries recorded over the last six calendar months."
        href="/admin/analytics"
        linkLabel="Detailed view"
      />
      <div className="ds-chart-caption">
        <div>
          <strong>{formatNumber(insight.currentMonthCount)}</strong>
          <span>Enquiries in selected month</span>
        </div>
        <span className="ds-chart-caption-tag">Last 6 months</span>
      </div>
      <div
        className="ds-bars"
        role="img"
        aria-label={
          "Six-month enquiry totals: " +
          insight.trend.map((p) => p.label + " " + p.count).join(", ")
        }
      >
        {insight.trend.map((point, index) => (
          <div className="ds-bar-group" key={point.key}>
            <span className="ds-bar-count">{point.count}</span>
            <div className="ds-bar-track">
              <span
                className={
                  "ds-bar " +
                  (index === insight.trend.length - 1 ? "ds-bar--current" : "")
                }
                style={{
                  height: point.count === 0 ? "0" : (point.count / max) * 100 + "%"
                }}
              />
            </div>
            <span className="ds-bar-month">{point.label}</span>
          </div>
        ))}
      </div>
      {allZero ? (
        <p className="ds-empty-inline">
          No enquiries recorded in this six-month window. Your chart will fill
          automatically as enquiries arrive.
        </p>
      ) : (
        <p className="ds-footnote">
          Counts exclude archived enquiries. Reporting uses UTC calendar months.
        </p>
      )}
    </section>
  );
}

const stageOrder = [
  "NEW",
  "IN_REVIEW",
  "QUALIFIED",
  "CONTACTED",
  "DISCOVERY",
  "PROPOSAL",
  "WON"
];
const stageColors = [
  "#c6c9ff",
  "#ab9bff",
  "#7565df",
  "#5958c7",
  "#85d9db",
  "#a8d6f3",
  "#b9d78c"
];

export function PipelinePanel({
  insight
}: {
  insight: DashboardInsight;
}): React.JSX.Element {
  const count = (key: string) =>
    insight.pipeline.find((p) => p.key === key)?.count ?? 0;
  const max = Math.max(1, ...stageOrder.map(count));
  const active = stageOrder.reduce((sum, item) => sum + count(item), 0);
  return (
    <section className="ds-panel ds-pipeline">
      <BlockHeading
        kicker="Intelligence / 02"
        title="Pipeline at a glance"
        href="/admin/leads"
        linkLabel="Open CRM"
      />
      <div className="ds-pipeline-tally">
        <strong>{formatNumber(active)}</strong>
        <span>Enquiries across the active sales stages</span>
      </div>
      <ul className="ds-pipeline-list">
        {stageOrder.map((key, i) => (
          <li key={key}>
            <div className="ds-pipeline-label">
              <span>
                <i aria-hidden="true" style={{ background: stageColors[i] }} />
                {prettyStatus(key)}
              </span>
              <strong>{count(key)}</strong>
            </div>
            <div className="ds-pipeline-track" aria-hidden="true">
              <div
                style={{
                  width: (count(key) / max) * 100 + "%",
                  background: stageColors[i]
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="ds-footnote">
        Stage totals are live counts, not estimated conversion figures.
      </p>
    </section>
  );
}

function calendarCells(monthKey: string): Array<{ day: number; iso: string } | null> {
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.UTC(year, month - 1, i + 1));
      return { day: i + 1, iso: date.toISOString().slice(0, 10) };
    })
  ];
}

function adjacentMonth(value: string, offset: number): string {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  return new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7);
}

export function EnquiryCalendar({
  insight
}: {
  insight: DashboardInsight;
}): React.JSX.Element {
  const year = Number(insight.focusMonth.slice(0, 4));
  const month = Number(insight.focusMonth.slice(5, 7));
  const first = new Date(Date.UTC(year, month - 1, 1));
  const heading = new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(first);
  const today = new Date().toISOString().slice(0, 10);
  const cells = calendarCells(insight.focusMonth);
  const max = Math.max(1, ...Object.values(insight.dailyCounts));
  return (
    <section className="ds-panel ds-calendar">
      <div className="ds-calendar-heading">
        <div>
          <span className="ds-kicker">Activity / Calendar</span>
          <h2>Enquiry calendar</h2>
          <p>Actual enquiry submissions, by date.</p>
        </div>
        <div className="ds-month-nav">
          <Link
            href={"/admin/calendar?month=" + adjacentMonth(insight.focusMonth, -1)}
            aria-label="Previous month"
          >
            ‹
          </Link>
          <span>{heading}</span>
          <Link
            href={"/admin/calendar?month=" + adjacentMonth(insight.focusMonth, 1)}
            aria-label="Next month"
          >
            ›
          </Link>
        </div>
      </div>
      <div className="ds-calendar-grid" aria-label={"Enquiry calendar for " + heading}>
        {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
          <span className="ds-calendar-weekday" key={i} aria-hidden="true">
            {day}
          </span>
        ))}
        {cells.map((entry, i) => {
          if (!entry) return <span className="ds-calendar-empty" key={"blank-" + i} />;
          const count = insight.dailyCounts[entry.iso] ?? 0;
          const intensity = count === 0 ? 0 : count / max;
          return (
            <div
              className={
                "ds-calendar-day " +
                (entry.iso === today ? "ds-calendar-day--today" : "")
              }
              key={entry.iso}
              title={entry.iso + ": " + count + " enquiries"}
              aria-label={entry.iso + ": " + count + " enquiries"}
              style={
                count
                  ? {
                      backgroundColor:
                        "rgba(91, 80, 205, " + (0.1 + 0.55 * intensity) + ")"
                    }
                  : undefined
              }
            >
              <span>{entry.day}</span>
              {count > 0 ? <small>{count}</small> : null}
            </div>
          );
        })}
      </div>
      <p className="ds-footnote">
        Darker dates represent more submissions. This is an activity calendar, not a
        meeting schedule.
      </p>
    </section>
  );
}

export function RecentEnquiries({
  insight
}: {
  insight: DashboardInsight;
}): React.JSX.Element {
  return (
    <section className="ds-panel ds-recent">
      <BlockHeading
        kicker="Operations / Live"
        title="Recent conversations"
        href="/admin/leads"
        linkLabel="All enquiries"
      />
      {insight.recent.length === 0 ? (
        <div className="ds-empty">
          <span className="ds-empty-symbol" aria-hidden="true">
            ✦
          </span>
          <strong>Your next conversation starts here.</strong>
          <p>New enquiries from your website will appear in this list.</p>
        </div>
      ) : (
        <ol className="ds-recent-list">
          {insight.recent.map((lead) => (
            <li key={lead.id}>
              <span className="ds-avatar" aria-hidden="true">
                {lead.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <Link href={"/admin/leads/" + lead.id}>{lead.name}</Link>
                <small>
                  {prettyStatus(lead.projectType)} ·{" "}
                  {lead.createdAt.toLocaleDateString("en-AU")}
                </small>
              </div>
              <span className="ds-recent-state">{prettyStatus(lead.status)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function AnalyticsBento({
  insight
}: {
  insight: DashboardInsight;
}): React.JSX.Element {
  if (!insight.available) {
    return (
      <section className="ds-panel ds-empty">
        <h2>Content workspace</h2>
        <p>
          Your operator role manages editorial content. CRM analytics are available only
          to authorized sales and administration roles.
        </p>
      </section>
    );
  }
  return (
    <>
      <div className="ds-bento-primary">
        <LeadVolumeChart insight={insight} />
        <PipelinePanel insight={insight} />
      </div>
      <div className="ds-bento-secondary">
        <EnquiryCalendar insight={insight} />
        <RecentEnquiries insight={insight} />
      </div>
    </>
  );
}

export function OperationsWorkspace({
  name,
  role,
  summary,
  insight,
  databaseReady
}: WorkspaceProps): React.JSX.Element {
  const firstName = name.trim().split(" ")[0] || "there";
  const date = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date());
  return (
    <div className="ds-workspace">
      <div className="ds-hero">
        <div>
          <span className="ds-kicker">VALTUM / STUDIO INTELLIGENCE</span>
          <h1>
            Good to see you, <em>{firstName}.</em>
          </h1>
          <p>One considered view of your studio, work and new opportunities.</p>
        </div>
        <div className="ds-hero-status">
          <span>{date} · UTC</span>
          <span
            className={
              databaseReady ? "ds-health ds-health--ok" : "ds-health ds-health--error"
            }
          >
            <i aria-hidden="true" />{" "}
            {databaseReady ? "Database connected" : "Database unavailable"}
          </span>
          <span className="ds-role-label">{role} workspace</span>
        </div>
      </div>
      <div className="ds-stats">
        {insight.available ? (
          <>
            <StatTile
              label="Total enquiries"
              value={insight.total}
              note="Non-archived leads in your CRM"
              tone="dark"
              href="/admin/leads"
            />
            <StatTile
              label="New conversations"
              value={insight.newCount}
              note="Waiting for initial review"
              tone="lilac"
              href="/admin/leads?status=NEW"
            />
            <StatTile
              label="Qualified leads"
              value={insight.qualifiedCount}
              note="Currently at qualified stage"
              tone="blue"
              href="/admin/leads?status=QUALIFIED"
            />
            <StatTile
              label="Won engagements"
              value={insight.wonCount}
              note="Marked won in the CRM"
              href="/admin/leads?status=WON"
            />
          </>
        ) : (
          <>
            {summary.projects && (
              <StatTile
                label="Portfolio projects"
                value={summary.projects.total}
                note="Published and draft records"
                tone="dark"
                href="/admin/projects"
              />
            )}
            {summary.services && (
              <StatTile
                label="Service offerings"
                value={summary.services.total}
                note="Managed service records"
                tone="lilac"
                href="/admin/services"
              />
            )}
            {summary.mediaCount !== undefined && (
              <StatTile
                label="Media library"
                value={summary.mediaCount}
                note="Recorded media assets"
                tone="blue"
                href="/admin/media"
              />
            )}
            {summary.projects && (
              <StatTile
                label="Published projects"
                value={summary.projects.published}
                note="Visible in published content"
                href="/admin/projects"
              />
            )}
          </>
        )}
      </div>
      <div className="ds-section-title">
        <div>
          <span className="ds-kicker">THE OPERATING PICTURE</span>
          <h2>Everything in focus.</h2>
        </div>
        {insight.available && (
          <Link href="/admin/analytics" className="ds-outline-link">
            View analytics <span aria-hidden="true">↗</span>
          </Link>
        )}
      </div>
      <AnalyticsBento insight={insight} />
      <section className="ds-footbar">
        <div>
          <span className="ds-kicker">WORKSPACE / SHORTCUTS</span>
          <h2>Move the work forward.</h2>
        </div>
        <div className="ds-quick-links">
          {summary.projects && <Link href="/admin/projects">Projects ↗</Link>}
          {summary.services && <Link href="/admin/services">Services ↗</Link>}
          {summary.mediaCount !== undefined && <Link href="/admin/media">Media ↗</Link>}
          {insight.available && <Link href="/admin/leads">Client enquiries ↗</Link>}
        </div>
      </section>
    </div>
  );
}
