import Link from "next/link";

import { getDeliveryInbox } from "@/modules/portal/server/delivery-inbox";
import { markAllDeliveryNotificationsReadAction } from "@/modules/portal/server/delivery-inbox-actions";

function inboxUrl(path: string, cursor: string | null): string {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  return path + (params.size ? "?" + params : "");
}

export async function DeliveryInbox({
  cursor,
  path
}: Readonly<{
  cursor: string | null;
  path: string;
}>): Promise<React.JSX.Element> {
  const inbox = await getDeliveryInbox(cursor);
  const format = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC"
  });
  return (
    <section className="delivery-inbox" aria-labelledby="delivery-inbox-title">
      <header className="delivery-inbox-header">
        <div>
          <h1 id="delivery-inbox-title">Project inbox.</h1>
          <p>
            Project decisions and updates that need your attention, drawn only from
            authorized delivery records.
          </p>
        </div>
        <div className="delivery-inbox-status">
          <strong>{inbox.unread}</strong>
          <span>{inbox.unread === 1 ? "unread update" : "unread updates"}</span>
        </div>
      </header>
      <div className="delivery-inbox-card">
        <div className="delivery-inbox-toolbar">
          <div>
            <h2>Activity addressed to you</h2>
            <p>Only in-app notices. No automatic email or SMS is implied.</p>
          </div>
          {inbox.unread > 0 ? (
            <form action={markAllDeliveryNotificationsReadAction}>
              <button type="submit">Mark all as read</button>
            </form>
          ) : null}
        </div>
        {inbox.records.length === 0 ? (
          <div className="delivery-inbox-empty">
            <strong>Nothing new to show</strong>
            <p>
              Requests, updates, replies and shared files will appear when work
              progresses on a project you can access.
            </p>
          </div>
        ) : (
          <ol className="delivery-inbox-list">
            {inbox.records.map((item) => {
              const href = inbox.customer
                ? "/portal/projects/" + item.engagement.id + "#workroom"
                : "/admin/clients/" +
                  item.engagement.workspaceId +
                  "?project=" +
                  item.engagement.id +
                  "#workroom";
              return (
                <li
                  key={item.id}
                  className={item.unread ? "delivery-inbox-item--unread" : undefined}
                >
                  <div className="delivery-inbox-dot" aria-hidden="true" />
                  <div>
                    <span className="delivery-inbox-project">
                      {item.engagement.workspace.name} · {item.engagement.title}
                    </span>
                    <Link href={href}>{item.summary}</Link>
                    <small>
                      {item.actor?.name ?? "Studio team"} ·{" "}
                      <time dateTime={item.createdAt.toISOString()}>
                        {format.format(item.createdAt)} UTC
                      </time>
                    </small>
                  </div>
                  {item.unread ? <span className="delivery-inbox-new">New</span> : null}
                </li>
              );
            })}
          </ol>
        )}
        <nav
          className="delivery-inbox-pagination"
          aria-label="Project inbox pagination"
        >
          {cursor ? <Link href={inboxUrl(path, null)}>Latest updates</Link> : null}
          {inbox.nextCursor ? (
            <Link href={inboxUrl(path, inbox.nextCursor)}>Older updates →</Link>
          ) : (
            <span>No older notices on this page</span>
          )}
        </nav>
      </div>
    </section>
  );
}
