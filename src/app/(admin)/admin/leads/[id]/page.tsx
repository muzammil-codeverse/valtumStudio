import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, LeadStatusBadge } from "@/modules/admin/ui/components/badges";
import { Button } from "@/modules/admin/ui/components/buttons";
import { Card, CardContent, CardHeader } from "@/modules/admin/ui/components/cards";
import {
  AdminPageBody,
  AdminPageContainer,
  AdminPageHeader
} from "@/modules/admin/ui/shell/PageComposition";
import { requirePermission } from "@/modules/auth/server/authorization";
import { leadPriorities, leadStatuses } from "@/modules/leads/domain/submission";
import {
  addLeadNoteAction,
  archiveLeadAction,
  assignLeadAction,
  changeLeadPriorityAction,
  changeLeadStatusAction,
  restoreLeadAction
} from "@/modules/leads/server/actions";
import {
  getLeadDetail,
  listEligibleLeadAssignees
} from "@/modules/leads/server/queries";
import { LeadActionForm } from "@/modules/leads/ui/LeadActionForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Lead detail | Siglum Studio Admin" };

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Value({
  label,
  value
}: {
  label: string;
  value: string | null | undefined;
}): React.JSX.Element {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[var(--admin-text)]">{value ?? "—"}</dd>
    </div>
  );
}

export default async function LeadDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "leads", "read");
  const { id } = await params;
  const [lead, assignees] = await Promise.all([
    getLeadDetail(id),
    listEligibleLeadAssignees()
  ]);
  if (lead === null) notFound();
  const archived = lead.archivedAt !== null;

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={lead.name}
        description={`${titleCase(lead.projectType)} enquiry submitted ${lead.createdAt.toLocaleString()}`}
        actions={
          <Link className="text-sm underline" href="/admin/leads">
            Back to leads
          </Link>
        }
      />
      <AdminPageBody>
        {archived ? (
          <p className="rounded-md border border-[var(--admin-warning)]/30 bg-[var(--admin-warning)]/10 p-3 text-sm text-[var(--admin-text)]">
            This lead is archived. Its history remains available, and it may be
            restored.
          </p>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Project brief"
                description="Information submitted by the prospective client."
              />
              <CardContent>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <Value label="Company" value={lead.company} />
                  <Value label="Location" value={lead.location} />
                  <Value label="Project type" value={titleCase(lead.projectType)} />
                  <Value label="Project stage" value={titleCase(lead.projectStage)} />
                  <Value
                    label="Timeline"
                    value={lead.timeline === null ? null : titleCase(lead.timeline)}
                  />
                  <Value
                    label="Budget"
                    value={
                      lead.budgetRange === null ? null : titleCase(lead.budgetRange)
                    }
                  />
                  <Value label="Existing product" value={lead.existingProductUrl} />
                  <Value
                    label="Requested services"
                    value={lead.serviceInterests
                      .map((item) => titleCase(item.interest))
                      .join(", ")}
                  />
                </dl>
                <div className="mt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">
                    Summary
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--admin-text)]">
                    {lead.projectSummary}
                  </p>
                </div>
                {lead.desiredOutcome === null ? null : (
                  <div className="mt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">
                      Desired outcome
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--admin-text)]">
                      {lead.desiredOutcome}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Contact and attribution" />
              <CardContent>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <Value label="Email" value={lead.email} />
                  <Value label="Referral" value={lead.referralSource} />
                  <Value label="Source" value={titleCase(lead.source)} />
                  <Value label="Source detail" value={lead.sourceDetail} />
                  <Value label="Landing page" value={lead.landingPageUrl} />
                  <Value label="Referrer" value={lead.referrerUrl} />
                  <Value label="UTM campaign" value={lead.utmCampaign} />
                  <Value
                    label="UTM source / medium"
                    value={
                      [lead.utmSource, lead.utmMedium].filter(Boolean).join(" / ") ||
                      null
                    }
                  />
                  <Value
                    label="Consent"
                    value={`${lead.consentAt?.toLocaleString() ?? "Legacy record"} · ${lead.consentVersion}`}
                  />
                </dl>
              </CardContent>
            </Card>
            <Card>
              <CardHeader
                title="Internal notes"
                description="Notes are append-only and visible only to authorized operators."
              />
              <CardContent>
                <LeadActionForm action={addLeadNoteAction}>
                  <input type="hidden" name="id" value={lead.id} />
                  <input type="hidden" name="revision" value={lead.revision} />
                  <label className="block text-xs font-semibold text-[var(--admin-text)]">
                    Add note
                    <textarea
                      name="body"
                      disabled={archived}
                      maxLength={4000}
                      rows={4}
                      className="mt-1 w-full rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] p-3 text-sm"
                    />
                  </label>
                  <Button className="mt-3" type="submit" disabled={archived}>
                    Add internal note
                  </Button>
                </LeadActionForm>
                <div className="mt-6 space-y-4">
                  {lead.notes.length === 0 ? (
                    <p className="text-sm text-[var(--admin-text-secondary)]">
                      No internal notes yet.
                    </p>
                  ) : (
                    lead.notes.map((note) => (
                      <article
                        key={note.id}
                        className="border-t border-[var(--admin-border)] pt-4"
                      >
                        <p className="whitespace-pre-wrap text-sm text-[var(--admin-text)]">
                          {note.body}
                        </p>
                        <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
                          {note.author.name} · {note.createdAt.toLocaleString()}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Activity" />
              <CardContent>
                <ol className="space-y-3">
                  {lead.activities.map((activity) => (
                    <li
                      key={activity.id}
                      className="border-l-2 border-[var(--admin-border)] pl-3 text-sm"
                    >
                      <p className="font-medium text-[var(--admin-text)]">
                        {titleCase(activity.type)}
                      </p>
                      <p className="text-xs text-[var(--admin-text-muted)]">
                        {activity.actor?.name ?? "System"} ·{" "}
                        {activity.createdAt.toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
          <aside className="space-y-6">
            <Card>
              <CardHeader title="Workflow" />
              <CardContent>
                <div className="mb-5 flex gap-2">
                  <LeadStatusBadge status={lead.status} />
                  <Badge
                    variant={
                      lead.priority === "URGENT"
                        ? "danger"
                        : lead.priority === "HIGH"
                          ? "warning"
                          : "default"
                    }
                  >
                    {titleCase(lead.priority)}
                  </Badge>
                </div>
                <LeadActionForm action={changeLeadStatusAction}>
                  <input type="hidden" name="id" value={lead.id} />
                  <input type="hidden" name="revision" value={lead.revision} />
                  <label className="block text-xs font-semibold">
                    Status
                    <select
                      name="status"
                      defaultValue={lead.status}
                      disabled={archived}
                      className="mt-1 w-full rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] p-2 text-sm"
                    >
                      {leadStatuses.map((status) => (
                        <option key={status} value={status}>
                          {titleCase(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button className="mt-2" type="submit" disabled={archived}>
                    Update status
                  </Button>
                </LeadActionForm>
                <LeadActionForm className="mt-5" action={changeLeadPriorityAction}>
                  <input type="hidden" name="id" value={lead.id} />
                  <input type="hidden" name="revision" value={lead.revision} />
                  <label className="block text-xs font-semibold">
                    Priority
                    <select
                      name="priority"
                      defaultValue={lead.priority}
                      disabled={archived}
                      className="mt-1 w-full rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] p-2 text-sm"
                    >
                      {leadPriorities.map((priority) => (
                        <option key={priority} value={priority}>
                          {titleCase(priority)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button className="mt-2" type="submit" disabled={archived}>
                    Update priority
                  </Button>
                </LeadActionForm>
                <LeadActionForm className="mt-5" action={assignLeadAction}>
                  <input type="hidden" name="id" value={lead.id} />
                  <input type="hidden" name="revision" value={lead.revision} />
                  <label className="block text-xs font-semibold">
                    Assignee
                    <select
                      name="assigneeUserId"
                      defaultValue={lead.assigneeUserId ?? ""}
                      disabled={archived}
                      className="mt-1 w-full rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] p-2 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {assignees.map((assignee) => (
                        <option key={assignee.id} value={assignee.id}>
                          {assignee.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button className="mt-2" type="submit" disabled={archived}>
                    Save assignment
                  </Button>
                </LeadActionForm>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Record" />
              <CardContent>
                <p className="text-sm text-[var(--admin-text-secondary)]">
                  Revision {lead.revision}
                </p>
                <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
                  Updated {lead.updatedAt.toLocaleString()}
                </p>
                <LeadActionForm
                  className="mt-5"
                  action={archived ? restoreLeadAction : archiveLeadAction}
                >
                  <input type="hidden" name="id" value={lead.id} />
                  <input type="hidden" name="revision" value={lead.revision} />
                  <Button type="submit" variant={archived ? "secondary" : "danger"}>
                    {archived ? "Restore lead" : "Archive lead"}
                  </Button>
                </LeadActionForm>
              </CardContent>
            </Card>
          </aside>
        </div>
      </AdminPageBody>
    </AdminPageContainer>
  );
}
