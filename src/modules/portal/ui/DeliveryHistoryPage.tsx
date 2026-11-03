import Link from "next/link";

import {
  historyUrl,
  historyViews,
  parseHistoryQuery
} from "@/modules/portal/domain/history-query";
import { isDeliveryFileExchangeEnabled } from "@/modules/portal/server/delivery-file-service";
import { getDeliveryHistory } from "@/modules/portal/server/delivery-history";

function readable(value: string): string {
  return value[0]?.toUpperCase() + value.slice(1).replaceAll("_", " ");
}

export async function DeliveryHistoryPage({
  projectId,
  base,
  returnHref,
  admin,
  params
}: Readonly<{
  projectId: string;
  base: string;
  returnHref: string;
  admin: boolean;
  params: {
    view?: string;
    cursor?: string;
    q?: string;
    status?: string;
  };
}>): Promise<React.JSX.Element> {
  const query = parseHistoryQuery(params);
  const page = await getDeliveryHistory(projectId, query);
  const dateFormat = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC"
  });
  const tabs = historyViews.map((view) => ({
    view,
    title: readable(view),
    url: historyUrl(base, projectId, { view }, admin)
  }));
  const filesEnabled = isDeliveryFileExchangeEnabled();

  return (
    <div className="delivery-history">
      <div className="delivery-history-header">
        <div>
          <Link className="delivery-history-back" href={returnHref}>
            ← Return to project
          </Link>
          <h1>Project history</h1>
          <p>
            Browse recorded conversations, approvals, files and changes without a
            history cutoff.
          </p>
        </div>
      </div>
      <nav className="delivery-history-tabs" aria-label="Project history categories">
        {tabs.map((tab) => (
          <Link
            key={tab.view}
            href={tab.url}
            aria-current={tab.view === query.view ? "page" : undefined}
            className={
              tab.view === query.view ? "delivery-history-tab--active" : undefined
            }
          >
            {tab.title}
          </Link>
        ))}
      </nav>
      <div className="delivery-history-board">
        <div className="delivery-history-panel-header">
          <div>
            <h2>{readable(query.view)}</h2>
            <p>Showing up to 24 records per page, newest first.</p>
          </div>
        </div>
        <form
          method="get"
          action={base}
          role="search"
          className="delivery-history-search"
        >
          {admin ? <input type="hidden" name="project" value={projectId} /> : null}
          <input type="hidden" name="view" value={query.view} />
          <div>
            <label htmlFor="history-query">Search in {query.view}</label>
            <input
              id="history-query"
              name="q"
              type="search"
              maxLength={80}
              defaultValue={query.search}
              placeholder={
                query.view === "files"
                  ? "Find a document"
                  : query.view === "activity"
                    ? "Find an event"
                    : query.view === "messages"
                      ? "Search a message"
                      : "Search an approval"
              }
            />
          </div>
          {query.view === "decisions" ? (
            <div>
              <label htmlFor="history-status">Approval status</label>
              <select
                id="history-status"
                name="status"
                defaultValue={query.status ?? ""}
              >
                <option value="">All statuses</option>
                <option value="REQUESTED">Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="CHANGES_REQUESTED">Changes requested</option>
                <option value="CANCELLED">Withdrawn</option>
              </select>
            </div>
          ) : null}
          <button type="submit">Apply filters</button>
          {query.search || query.status ? (
            <Link href={historyUrl(base, projectId, { view: query.view }, admin)}>
              Clear
            </Link>
          ) : null}
        </form>
        {page.records.length === 0 ? (
          <div className="delivery-history-empty">
            <strong>No matching records</strong>
            <p>
              {query.cursor
                ? "There are no more entries on this page. Return to the latest records."
                : "This project has no entries matching these filters."}
            </p>
          </div>
        ) : (
          <ol className="delivery-history-records">
            {page.records.map((record) => (
              <li key={record.id}>
                <div className="delivery-history-record-heading">
                  <strong>{record.title}</strong>
                  <time dateTime={record.createdAt.toISOString()}>
                    {dateFormat.format(record.createdAt)} UTC
                  </time>
                </div>
                <span>{record.meta}</span>
                {record.body ? <p>{record.body}</p> : null}
                {record.fileId ? (
                  filesEnabled ? (
                    <Link href={"/api/delivery/files/" + record.fileId}>
                      Download verified file
                    </Link>
                  ) : (
                    <small>File downloads are currently unavailable.</small>
                  )
                ) : null}
              </li>
            ))}
          </ol>
        )}
        <nav className="delivery-history-pagination" aria-label="History pagination">
          <span>{page.records.length} records shown</span>
          {query.cursor ? (
            <Link
              href={historyUrl(
                base,
                projectId,
                {
                  view: query.view,
                  search: query.search,
                  status: query.status
                },
                admin
              )}
            >
              Back to latest
            </Link>
          ) : null}
          {page.nextCursor ? (
            <Link
              href={historyUrl(
                base,
                projectId,
                {
                  ...query,
                  cursor: page.nextCursor
                },
                admin
              )}
            >
              Older records →
            </Link>
          ) : (
            <span>End of available history</span>
          )}
        </nav>
      </div>
    </div>
  );
}
