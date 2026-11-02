import Link from "next/link";

import { getDeliveryCollaboration } from "@/modules/portal/server/collaboration-read";
import {
  cancelClientDecisionAction,
  requestClientDecisionAction,
  respondClientDecisionAction
} from "@/modules/portal/server/delivery-decision-actions";
import { isDeliveryFileExchangeEnabled } from "@/modules/portal/server/delivery-file-service";
import { postDeliveryMessageAction } from "@/modules/portal/server/delivery-message-actions";

import { DeliveryFileUploader } from "./DeliveryFileUploader";

function formatDate(value: Date | null | undefined): string {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(value);
}

function readable(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}

export async function DeliveryWorkroom({
  engagementId,
  tasks,
  milestones
}: Readonly<{
  engagementId: string;
  tasks: readonly { id: string; title: string }[];
  milestones: readonly { id: string; title: string }[];
}>): Promise<React.JSX.Element> {
  const { access, decisions, messages, files, activity } =
    await getDeliveryCollaboration(engagementId);
  const customer = access.customer;
  const pending = decisions.filter((item) => item.status === "REQUESTED").length;

  return (
    <section
      id="workroom"
      className="delivery-workroom"
      aria-label="Project collaboration"
    >
      <header className="delivery-workroom-heading">
        <div>
          <h2>One project. One shared workspace.</h2>
          <p>
            Decisions, conversations, files and activity remain connected to the project
            they belong to.
          </p>
        </div>
        <nav aria-label="Workroom sections" className="delivery-workroom-nav">
          <a href="#approvals">Decisions</a>
          <a href="#conversation">Conversation</a>
          <a href="#project-files">Files</a>
          <a href="#delivery-activity">Activity</a>
        </nav>
      </header>
      <div className="delivery-workroom-grid">
        <section
          className="delivery-workroom-panel"
          id="approvals"
          aria-labelledby="delivery-approvals-title"
        >
          <div className="delivery-panel-top">
            <div>
              <h3 id="delivery-approvals-title">Decisions and approvals</h3>
              <p>Clear requests with a recorded response, not implied sign-off.</p>
            </div>
            <span className="delivery-count">{pending} pending</span>
          </div>
          {decisions.length === 0 ? (
            <p className="delivery-empty">
              No decisions have been requested for this project.
            </p>
          ) : (
            <div className="delivery-decision-list">
              {decisions.map((item) => (
                <article className="delivery-decision" key={item.id}>
                  <div className="delivery-decision-head">
                    <strong>{item.title}</strong>
                    <span
                      className={
                        "delivery-status delivery-status--" + item.status.toLowerCase()
                      }
                    >
                      {readable(item.status)}
                    </span>
                  </div>
                  <p>{item.description}</p>
                  {item.milestone ? (
                    <small>Milestone: {item.milestone.title}</small>
                  ) : null}
                  <small>
                    Requested {formatDate(item.createdAt)}
                    {item.dueDate
                      ? " · Response requested by " + formatDate(item.dueDate)
                      : ""}
                  </small>
                  {item.respondedAt ? (
                    <div className="delivery-response">
                      <span>
                        Response from {item.respondedBy?.name ?? "customer"} ·{" "}
                        {formatDate(item.respondedAt)}
                      </span>
                      {item.responseNote ? <p>{item.responseNote}</p> : null}
                    </div>
                  ) : null}
                  {item.status === "REQUESTED" &&
                  item.milestone &&
                  item.milestoneRevision !== item.milestone.contentRevision ? (
                    <p className="delivery-obsolete">
                      This milestone has changed since the request was made. The studio
                      must withdraw it and send a fresh approval request.
                    </p>
                  ) : null}
                  {customer &&
                  item.status === "REQUESTED" &&
                  (!item.milestone ||
                    item.milestoneRevision === item.milestone.contentRevision) ? (
                    <form
                      action={respondClientDecisionAction}
                      className="delivery-response-form"
                    >
                      <input type="hidden" name="engagementId" value={engagementId} />
                      <input type="hidden" name="decisionId" value={item.id} />
                      <input type="hidden" name="revision" value={item.revision} />
                      <label htmlFor={"decision-state-" + item.id}>Your decision</label>
                      <select
                        id={"decision-state-" + item.id}
                        name="status"
                        defaultValue="APPROVED"
                      >
                        <option value="APPROVED">Approve this request</option>
                        <option value="CHANGES_REQUESTED">Request changes</option>
                      </select>
                      <label htmlFor={"decision-note-" + item.id}>
                        Feedback (required when requesting changes)
                      </label>
                      <textarea
                        id={"decision-note-" + item.id}
                        name="responseNote"
                        rows={3}
                        maxLength={2000}
                        placeholder="Your decision and any specific revisions"
                      />
                      <button type="submit">Record decision</button>
                    </form>
                  ) : null}
                  {!customer && item.status === "REQUESTED" ? (
                    <form action={cancelClientDecisionAction}>
                      <input type="hidden" name="engagementId" value={engagementId} />
                      <input type="hidden" name="decisionId" value={item.id} />
                      <button type="submit" className="delivery-subtle-button">
                        Withdraw request
                      </button>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          )}
          {!customer ? (
            <details className="delivery-compose">
              <summary>Request a customer decision</summary>
              <form action={requestClientDecisionAction}>
                <input type="hidden" name="engagementId" value={engagementId} />
                <label htmlFor="delivery-request-title">What needs a decision?</label>
                <input
                  id="delivery-request-title"
                  name="title"
                  required
                  minLength={2}
                  maxLength={160}
                />
                <label htmlFor="delivery-request-detail">
                  What is the customer approving?
                </label>
                <textarea
                  id="delivery-request-detail"
                  name="description"
                  rows={4}
                  required
                  minLength={10}
                  maxLength={4000}
                />
                <label htmlFor="delivery-request-milestone">
                  Related milestone (optional)
                </label>
                <select
                  id="delivery-request-milestone"
                  name="milestoneId"
                  defaultValue=""
                >
                  <option value="">Project-wide decision</option>
                  {milestones.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
                <label htmlFor="delivery-request-date">
                  Requested response date (optional)
                </label>
                <input id="delivery-request-date" type="date" name="dueDate" />
                <button type="submit">Send approval request</button>
              </form>
            </details>
          ) : null}
        </section>
        <section
          className="delivery-workroom-panel"
          id="conversation"
          aria-labelledby="delivery-messages-title"
        >
          <div className="delivery-panel-top">
            <div>
              <h3 id="delivery-messages-title">Project conversation</h3>
              <p>Ask questions, clarify tasks and keep decisions in one place.</p>
            </div>
            <span className="delivery-count">Latest {messages.length}</span>
          </div>
          {messages.length === 0 ? (
            <p className="delivery-empty">
              No messages yet. Start with a specific question or update.
            </p>
          ) : (
            <div className="delivery-message-list">
              {messages.map((message) => (
                <article key={message.id} className="delivery-message">
                  <div className="delivery-message-head">
                    <strong>{message.author.name}</strong>
                    <time dateTime={message.createdAt.toISOString()}>
                      {formatDate(message.createdAt)}
                    </time>
                  </div>
                  {message.task ? (
                    <span className="delivery-message-context">
                      Task: {message.task.title}
                    </span>
                  ) : null}
                  <p>{message.body}</p>
                </article>
              ))}
            </div>
          )}
          <form action={postDeliveryMessageAction} className="delivery-compose-form">
            <input type="hidden" name="engagementId" value={engagementId} />
            <label htmlFor={"delivery-message-" + engagementId}>
              Write a project message
            </label>
            <textarea
              id={"delivery-message-" + engagementId}
              name="body"
              rows={4}
              minLength={2}
              maxLength={4000}
              placeholder="Share a clear question, decision or update"
              required
            />
            <label htmlFor={"delivery-task-" + engagementId}>
              Related task (optional)
            </label>
            <select id={"delivery-task-" + engagementId} name="taskId" defaultValue="">
              <option value="">General project conversation</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
            <button type="submit">Post message</button>
          </form>
        </section>
        <section
          className="delivery-workroom-panel"
          id="project-files"
          aria-labelledby="delivery-files-title"
        >
          <div className="delivery-panel-top">
            <div>
              <h3 id="delivery-files-title">Shared project files</h3>
              <p>Private documents attached to this engagement.</p>
            </div>
            <span className="delivery-count">{files.length} verified</span>
          </div>
          {files.length === 0 ? (
            <p className="delivery-empty">
              No verified project files have been shared.
            </p>
          ) : (
            <ul className="delivery-files">
              {files.map((file) => (
                <li key={file.id}>
                  <span className="delivery-file-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      width="19"
                      height="19"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 3.5h8l4 4v13H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" />
                      <path d="M14 3.5v5h5M8 13h8M8 17h6" />
                    </svg>
                  </span>
                  <div>
                    <strong>{file.filename}</strong>
                    <small>
                      Shared by {file.uploader.name} · {formatDate(file.createdAt)}
                      {" · "}
                      {(file.byteSize / (1024 * 1024)).toFixed(2)} MB
                    </small>
                  </div>
                  <Link href={"/api/delivery/files/" + file.id}>Download</Link>
                </li>
              ))}
            </ul>
          )}
          {isDeliveryFileExchangeEnabled() ? (
            <DeliveryFileUploader engagementId={engagementId} />
          ) : (
            <p className="delivery-empty">
              File uploads will open after the studio verifies private storage and
              security controls.
            </p>
          )}
        </section>
        <section
          className="delivery-workroom-panel"
          id="delivery-activity"
          aria-labelledby="delivery-activity-title"
        >
          <div className="delivery-panel-top">
            <div>
              <h3 id="delivery-activity-title">Recorded activity</h3>
              <p>Changes and interactions preserved in the project history.</p>
            </div>
          </div>
          {activity.length === 0 ? (
            <p className="delivery-empty">
              New decisions, messages, files and invoice status changes appear here.
            </p>
          ) : (
            <ol className="delivery-activity-list">
              {activity.map((event) => (
                <li key={event.id}>
                  <span className="delivery-activity-mark" aria-hidden="true" />
                  <div>
                    <strong>{event.summary}</strong>
                    <small>
                      {event.actor?.name ?? "Former team member"} ·{" "}
                      {formatDate(event.createdAt)}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </section>
  );
}
