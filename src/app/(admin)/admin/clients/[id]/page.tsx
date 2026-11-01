import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { can } from "@/modules/auth/policies/authorization";
import { requirePermission } from "@/modules/auth/server/authorization";
import {
  addClientTaskAction,
  addExistingClientAction,
  addMilestoneAction,
  changeEngagementStateAction,
  changeMilestoneStateAction,
  changeTaskStateAction,
  createEngagementAction,
  createInvoiceAction,
  issueInvoiceAction,
  postClientUpdateAction,
  provisionClientAction
} from "@/modules/portal/server/admin-actions";
import {
  clientReadableStatus,
  formatClientMoney,
  isClientPortalEnabled
} from "@/modules/portal/server/client-data";

export const dynamic = "force-dynamic";

export default async function AdminClientWorkspacePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; project?: string }>;
}): Promise<React.JSX.Element> {
  if (!isClientPortalEnabled()) notFound();
  const principal = await requirePermission(await headers(), "clients", "read");
  const { id } = await params;
  if (id.length > 128) notFound();
  const workspace = await prisma.clientWorkspace.findUnique({
    where: { id },
    include: {
      memberships: {
        include: { user: { select: { name: true, email: true, banned: true } } },
        orderBy: { createdAt: "asc" }
      },
      engagements: {
        include: {
          milestones: { orderBy: { sortOrder: "asc" } },
          tasks: { orderBy: { sortOrder: "asc" } },
          invoices: { orderBy: { createdAt: "desc" } },
          updates: { orderBy: { createdAt: "desc" } }
        },
        orderBy: { updatedAt: "desc" }
      }
    }
  });
  if (!workspace) notFound();
  const query = await searchParams;
  const selected =
    workspace.engagements.find((engagement) => engagement.id === query.project) ??
    workspace.engagements[0] ??
    null;
  const mayProvision = can(principal.role, { resource: "users", action: "create" });
  const canManage = can(principal.role, { resource: "clients", action: "manage" });
  return (
    <div className="ds-workspace">
      <div className="ds-hero">
        <div>
          <Link className="ds-inline-link" href="/admin/clients">
            ← Client directory
          </Link>
          <span className="ds-kicker" style={{ display: "block", marginTop: 18 }}>
            CLIENT WORKSPACE / PRIVATE
          </span>
          <h1>{workspace.name}</h1>
          <p>
            {workspace.memberships.length} authorized members ·{" "}
            {workspace.engagements.length} delivery engagements
          </p>
        </div>
        <span className="ds-health ds-health--ok">Membership-protected</span>
      </div>
      {query.notice ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-[#d9d4f3] bg-[#eeeaff] p-3 text-sm"
        >
          Account update: {clientReadableStatus(query.notice)}
        </p>
      ) : null}
      <div className="ds-bento-primary">
        <section className="ds-panel">
          <div className="ds-block-heading">
            <div>
              <span className="ds-kicker">ACCESS CONTROL</span>
              <h2>Authorized customer members</h2>
            </div>
          </div>
          {workspace.memberships.length === 0 ? (
            <p className="ds-empty-inline">
              No customer accounts are assigned to this workspace.
            </p>
          ) : (
            workspace.memberships.map((member) => (
              <div className="portal-row" key={member.id}>
                <div className="portal-row-main">
                  <strong>{member.user.name}</strong>
                  <small>
                    {member.user.email} · {clientReadableStatus(member.role)}
                  </small>
                </div>
                <span className="portal-tag">
                  {member.user.banned ? "Suspended" : "Active"}
                </span>
              </div>
            ))
          )}
          {canManage ? (
            <form
              action={addExistingClientAction}
              className="mt-5 grid gap-3 border-t border-[var(--admin-border)] pt-4"
            >
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <label className="text-xs font-semibold" htmlFor="client-existing-email">
                Assign an existing client account
              </label>
              <input
                id="client-existing-email"
                name="email"
                type="email"
                required
                placeholder="client@example.com"
                className="rounded-lg border border-[var(--admin-border-strong)] p-3 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#5146bd] px-4 py-3 text-xs font-semibold text-white"
              >
                Grant workspace membership
              </button>
            </form>
          ) : null}
        </section>
        {mayProvision ? (
          <section className="ds-panel">
            <div className="ds-block-heading">
              <div>
                <span className="ds-kicker">ACCOUNT PROVISIONING / OWNER ONLY</span>
                <h2>Create a customer login</h2>
              </div>
            </div>
            <p className="ds-footnote">
              Creates a client-only account with no administrator permissions. Supply a
              temporary password privately. The client must change it and configure
              two-factor authentication.
            </p>
            <form action={provisionClientAction} className="mt-5 grid gap-3">
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <label className="text-xs font-semibold" htmlFor="new-client-full-name">
                Client name
              </label>
              <input
                id="new-client-full-name"
                name="name"
                maxLength={120}
                minLength={2}
                required
                className="rounded-lg border border-[var(--admin-border-strong)] p-3 text-sm"
              />
              <label className="text-xs font-semibold" htmlFor="new-client-email">
                Email
              </label>
              <input
                id="new-client-email"
                name="email"
                type="email"
                required
                className="rounded-lg border border-[var(--admin-border-strong)] p-3 text-sm"
              />
              <label className="text-xs font-semibold" htmlFor="new-client-password">
                Temporary password (14 characters minimum)
              </label>
              <input
                id="new-client-password"
                name="password"
                type="password"
                minLength={14}
                maxLength={128}
                autoComplete="new-password"
                required
                className="rounded-lg border border-[var(--admin-border-strong)] p-3 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#211e37] px-4 py-3 text-xs font-semibold text-white"
              >
                Create client account ↗
              </button>
            </form>
          </section>
        ) : (
          <section className="ds-panel">
            <div className="ds-block-heading">
              <div>
                <span className="ds-kicker">ACCESS</span>
                <h2>Account provisioning</h2>
              </div>
            </div>
            <p className="ds-footnote">
              Only the studio owner can create new customer login accounts.
            </p>
          </section>
        )}
      </div>
      <div className="ds-bento-primary">
        <section className="ds-panel">
          <div className="ds-block-heading">
            <div>
              <span className="ds-kicker">DELIVERY</span>
              <h2>Engagements</h2>
            </div>
          </div>
          {workspace.engagements.length === 0 ? (
            <p className="ds-empty-inline">No engagements created yet.</p>
          ) : (
            workspace.engagements.map((engagement) => (
              <div key={engagement.id} className="portal-row">
                <div className="portal-row-main">
                  <Link
                    href={
                      "/admin/clients/" + workspace.id + "?project=" + engagement.id
                    }
                  >
                    {engagement.title}
                  </Link>
                  <small>
                    {engagement.milestones.length} milestones ·{" "}
                    {engagement.tasks.length} tasks
                  </small>
                </div>
                <span className="portal-tag">
                  {clientReadableStatus(engagement.status)}
                </span>
              </div>
            ))
          )}
        </section>
        {canManage ? (
          <section className="ds-panel">
            <div className="ds-block-heading">
              <div>
                <span className="ds-kicker">NEW ENGAGEMENT</span>
                <h2>Start a project</h2>
              </div>
            </div>
            <form action={createEngagementAction} className="mt-5 grid gap-3">
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <label htmlFor="engagement-title" className="text-xs font-semibold">
                Project name
              </label>
              <input
                id="engagement-title"
                name="title"
                minLength={2}
                maxLength={160}
                required
                className="rounded-lg border border-[var(--admin-border-strong)] p-3 text-sm"
              />
              <label htmlFor="engagement-summary" className="text-xs font-semibold">
                Client-facing summary
              </label>
              <textarea
                id="engagement-summary"
                name="summary"
                maxLength={2000}
                rows={3}
                className="rounded-lg border border-[var(--admin-border-strong)] p-3 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#5146bd] px-4 py-3 text-xs font-semibold text-white"
              >
                Create engagement ↗
              </button>
            </form>
          </section>
        ) : null}
      </div>
      {selected ? (
        <div className="ds-detail-stack">
          <section className="ds-panel">
            <span className="ds-kicker">SELECTED PROJECT</span>
            <h2 style={{ fontSize: 26, fontWeight: 750, marginTop: 8 }}>
              {selected.title}
            </h2>
            <p style={{ fontSize: 13, color: "#686a7b", marginTop: 5 }}>
              {selected.summary || "No summary yet."}
            </p>
            {canManage ? (
              <form
                action={changeEngagementStateAction}
                className="mt-4 flex items-center gap-3"
              >
                <input type="hidden" name="engagementId" value={selected.id} />
                <label htmlFor="engagement-status" className="text-xs font-semibold">
                  Delivery stage
                </label>
                <select
                  id="engagement-status"
                  name="status"
                  defaultValue={selected.status}
                  className="rounded-md border border-[var(--admin-border-strong)] p-2 text-xs"
                >
                  {["PLANNING", "ACTIVE", "REVIEW", "COMPLETE", "ON_HOLD"].map(
                    (state) => (
                      <option key={state} value={state}>
                        {clientReadableStatus(state)}
                      </option>
                    )
                  )}
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-[#211e37] px-4 py-2 text-xs text-white"
                >
                  Save stage
                </button>
              </form>
            ) : null}
          </section>
          <div className="ds-bento-primary">
            <section className="ds-panel">
              <div className="ds-block-heading">
                <div>
                  <span className="ds-kicker">DELIVERY / PLAN</span>
                  <h2>Milestones</h2>
                </div>
              </div>
              {selected.milestones.map((m) => (
                <div key={m.id} className="portal-row">
                  <div className="portal-row-main">
                    <strong>{m.title}</strong>
                    <small>
                      {m.dueDate?.toLocaleDateString("en-AU") ?? "No due date"}
                    </small>
                  </div>
                  <span className="portal-tag">{clientReadableStatus(m.status)}</span>
                  {canManage ? (
                    <form action={changeMilestoneStateAction} className="flex gap-2">
                      <input type="hidden" name="milestoneId" value={m.id} />
                      <select
                        name="status"
                        defaultValue={m.status}
                        className="rounded-md border border-[var(--admin-border)] p-1 text-xs"
                      >
                        {[
                          "PLANNED",
                          "IN_PROGRESS",
                          "AWAITING_REVIEW",
                          "APPROVED",
                          "COMPLETE"
                        ].map((s) => (
                          <option key={s} value={s}>
                            {clientReadableStatus(s)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-md bg-[#5146bd] p-2 text-xs text-white"
                      >
                        Save
                      </button>
                    </form>
                  ) : null}
                </div>
              ))}
              {canManage ? (
                <form
                  action={addMilestoneAction}
                  className="mt-5 grid grid-cols-1 gap-2 border-t border-[var(--admin-border)] pt-4"
                >
                  <input type="hidden" name="engagementId" value={selected.id} />
                  <label htmlFor="milestone-title" className="text-xs font-semibold">
                    New milestone
                  </label>
                  <input
                    id="milestone-title"
                    name="title"
                    minLength={2}
                    maxLength={160}
                    required
                    className="rounded-lg border p-3 text-sm"
                  />
                  <label htmlFor="milestone-due" className="text-xs font-semibold">
                    Target date (optional)
                  </label>
                  <input
                    id="milestone-due"
                    type="date"
                    name="dueDate"
                    className="rounded-lg border p-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#5146bd] p-3 text-xs text-white"
                  >
                    Add milestone
                  </button>
                </form>
              ) : null}
            </section>
            <section className="ds-panel">
              <div className="ds-block-heading">
                <div>
                  <span className="ds-kicker">DELIVERY / TASKS</span>
                  <h2>Task board</h2>
                </div>
              </div>
              {selected.tasks.map((task) => (
                <div key={task.id} className="portal-row">
                  <div className="portal-row-main">
                    <strong>{task.title}</strong>
                    <small>
                      {task.dueDate?.toLocaleDateString("en-AU") ?? "Flexible deadline"}
                    </small>
                  </div>
                  <span className="portal-tag">
                    {clientReadableStatus(task.status)}
                  </span>
                  {canManage ? (
                    <form action={changeTaskStateAction} className="flex gap-2">
                      <input type="hidden" name="taskId" value={task.id} />
                      <select
                        name="status"
                        defaultValue={task.status}
                        className="rounded-md border p-1 text-xs"
                      >
                        {["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"].map((s) => (
                          <option key={s} value={s}>
                            {clientReadableStatus(s)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-md bg-[#5146bd] p-2 text-xs text-white"
                      >
                        Save
                      </button>
                    </form>
                  ) : null}
                </div>
              ))}
              {canManage ? (
                <form
                  action={addClientTaskAction}
                  className="mt-5 grid gap-2 border-t border-[var(--admin-border)] pt-4"
                >
                  <input type="hidden" name="engagementId" value={selected.id} />
                  <label htmlFor="task-title" className="text-xs font-semibold">
                    New task
                  </label>
                  <input
                    id="task-title"
                    name="title"
                    minLength={2}
                    maxLength={160}
                    required
                    className="rounded-lg border p-3 text-sm"
                  />
                  <label htmlFor="task-due" className="text-xs font-semibold">
                    Due date (optional)
                  </label>
                  <input
                    id="task-due"
                    type="date"
                    name="dueDate"
                    className="rounded-lg border p-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#5146bd] p-3 text-xs text-white"
                  >
                    Add task
                  </button>
                </form>
              ) : null}
            </section>
          </div>
          <div className="ds-bento-primary">
            <section className="ds-panel">
              <div className="ds-block-heading">
                <div>
                  <span className="ds-kicker">BILLING / PRIVATE</span>
                  <h2>Invoices</h2>
                </div>
              </div>
              {selected.invoices.map((invoice) => (
                <div className="portal-row" key={invoice.id}>
                  <div className="portal-row-main">
                    <strong>{invoice.reference}</strong>
                    <small>
                      {formatClientMoney(invoice.amountCents, invoice.currency)} ·{" "}
                      {clientReadableStatus(invoice.status)}
                    </small>
                  </div>
                  {invoice.status === "DRAFT" && canManage ? (
                    <form action={issueInvoiceAction}>
                      <input type="hidden" name="invoiceId" value={invoice.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-[#5146bd] p-2 text-xs text-white"
                      >
                        Issue invoice
                      </button>
                    </form>
                  ) : null}
                </div>
              ))}
              {canManage ? (
                <form
                  action={createInvoiceAction}
                  className="mt-5 grid gap-3 border-t border-[var(--admin-border)] pt-4"
                >
                  <input type="hidden" name="engagementId" value={selected.id} />
                  <label htmlFor="invoice-reference" className="text-xs font-semibold">
                    Invoice reference
                  </label>
                  <input
                    id="invoice-reference"
                    name="reference"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="INV-001"
                    className="rounded-lg border p-3 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="invoice-amount"
                        className="block text-xs font-semibold"
                      >
                        Amount
                      </label>
                      <input
                        id="invoice-amount"
                        type="text"
                        inputMode="decimal"
                        name="amount"
                        required
                        pattern="[0-9]+(\.[0-9]{1,2})?"
                        className="w-full rounded-lg border p-3 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="invoice-currency"
                        className="block text-xs font-semibold"
                      >
                        Currency
                      </label>
                      <select
                        id="invoice-currency"
                        name="currency"
                        defaultValue="AUD"
                        className="w-full rounded-lg border p-3 text-sm"
                      >
                        {["AUD", "USD", "GBP", "EUR", "AED", "SAR"].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label htmlFor="invoice-due" className="text-xs font-semibold">
                    Due date
                  </label>
                  <input
                    id="invoice-due"
                    name="dueDate"
                    type="date"
                    className="rounded-lg border p-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#5146bd] p-3 text-xs text-white"
                  >
                    Save invoice draft
                  </button>
                  <p className="ds-footnote">
                    Draft invoices are private. Issue one only after checking the
                    commercial agreement.
                  </p>
                </form>
              ) : null}
            </section>
            <section className="ds-panel">
              <div className="ds-block-heading">
                <div>
                  <span className="ds-kicker">CLIENT COMMUNICATION</span>
                  <h2>Published updates</h2>
                </div>
              </div>
              {selected.updates.map((update) => (
                <div key={update.id} className="portal-row">
                  <div className="portal-row-main">
                    <strong>{update.title}</strong>
                    <small>
                      {update.publishedAt
                        ? "Published " + update.publishedAt.toLocaleDateString("en-AU")
                        : "Draft"}
                    </small>
                  </div>
                </div>
              ))}
              {canManage ? (
                <form
                  action={postClientUpdateAction}
                  className="mt-5 grid gap-2 border-t border-[var(--admin-border)] pt-4"
                >
                  <input type="hidden" name="engagementId" value={selected.id} />
                  <label htmlFor="update-title" className="text-xs font-semibold">
                    Update title
                  </label>
                  <input
                    id="update-title"
                    name="title"
                    required
                    minLength={2}
                    maxLength={160}
                    className="rounded-lg border p-3 text-sm"
                  />
                  <label htmlFor="update-body" className="text-xs font-semibold">
                    Delivery note
                  </label>
                  <textarea
                    id="update-body"
                    name="body"
                    required
                    minLength={10}
                    maxLength={10000}
                    rows={4}
                    className="rounded-lg border p-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#5146bd] p-3 text-xs text-white"
                  >
                    Publish update to client ↗
                  </button>
                  <p className="ds-footnote">
                    This action immediately publishes the note to authorized clients.
                  </p>
                </form>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
