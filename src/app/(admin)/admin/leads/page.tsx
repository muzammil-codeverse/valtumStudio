import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { Badge, LeadStatusBadge } from "@/modules/admin/ui/components/badges";
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableEmpty,
  AdminTableFrame,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow
} from "@/modules/admin/ui/components/tables";
import {
  AdminPageBody,
  AdminPageContainer,
  AdminPageHeader
} from "@/modules/admin/ui/shell/PageComposition";
import { requirePermission } from "@/modules/auth/server/authorization";
import {
  leadPriorities,
  leadSources,
  leadStatuses
} from "@/modules/leads/domain/submission";
import {
  listEligibleLeadAssignees,
  listLeads,
  parseLeadListFilters
} from "@/modules/leads/server/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leads | Valtum Studio Admin",
  description: "Manage private client enquiries."
};

type SearchParams = Record<string, string | string[] | undefined>;

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "leads", "read");
  const filters = parseLeadListFilters(await searchParams);
  const [{ items, pageSize, total }, assignees] = await Promise.all([
    listLeads(filters),
    listEligibleLeadAssignees()
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const previousHref = `/admin/leads?page=${Math.max(1, filters.page - 1)}`;
  const nextHref = `/admin/leads?page=${Math.min(totalPages, filters.page + 1)}`;

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Client leads"
        description="Review private enquiries, assign owners, and maintain a clear sales workflow."
      />
      <AdminPageBody>
        <form className="grid gap-3 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-subtle)] p-4 md:grid-cols-5">
          <label className="text-xs text-[var(--admin-text-secondary)] md:col-span-2">
            Search
            <input
              name="q"
              defaultValue={filters.search}
              className="mt-1 w-full rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-[var(--admin-text-secondary)]">
            Status
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {leadStatuses.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[var(--admin-text-secondary)]">
            Priority
            <select
              name="priority"
              defaultValue={filters.priority ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-3 py-2 text-sm"
            >
              <option value="">All priorities</option>
              {leadPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {titleCase(priority)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[var(--admin-text-secondary)]">
            Archive
            <select
              name="archived"
              defaultValue={filters.archived}
              className="mt-1 w-full rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </select>
          </label>
          <label className="text-xs text-[var(--admin-text-secondary)]">
            Source
            <select
              name="source"
              defaultValue={filters.source ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-3 py-2 text-sm"
            >
              <option value="">All sources</option>
              {leadSources.map((source) => (
                <option key={source} value={source}>
                  {titleCase(source)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[var(--admin-text-secondary)]">
            Assignee
            <select
              name="assignee"
              defaultValue={filters.assigneeUserId ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-3 py-2 text-sm"
            >
              <option value="">All assignees</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="self-end rounded-md bg-[var(--admin-text)] px-4 py-2 text-sm font-medium text-[var(--admin-surface)]"
          >
            Apply filters
          </button>
        </form>
        <AdminTableFrame>
          <AdminTable>
            <AdminTableHead>
              <AdminTableRow>
                <AdminTableHeaderCell>Lead</AdminTableHeaderCell>
                <AdminTableHeaderCell>Project</AdminTableHeaderCell>
                <AdminTableHeaderCell>Status</AdminTableHeaderCell>
                <AdminTableHeaderCell>Priority</AdminTableHeaderCell>
                <AdminTableHeaderCell>Assignee</AdminTableHeaderCell>
                <AdminTableHeaderCell align="right">Submitted</AdminTableHeaderCell>
              </AdminTableRow>
            </AdminTableHead>
            <AdminTableBody>
              {items.length === 0 ? (
                <AdminTableEmpty
                  colSpan={6}
                  message={
                    total === 0
                      ? "No leads received yet."
                      : "No leads match these filters."
                  }
                  description="New enquiries will appear here after a valid public submission."
                />
              ) : (
                items.map((lead) => (
                  <AdminTableRow key={lead.id}>
                    <AdminTableCell isPrimary>
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="hover:underline"
                      >
                        {lead.name}
                      </Link>
                      <span className="block text-[11px] text-[var(--admin-text-muted)]">
                        {lead.company ?? lead.source}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>{titleCase(lead.projectType)}</AdminTableCell>
                    <AdminTableCell>
                      <LeadStatusBadge status={lead.status} />
                    </AdminTableCell>
                    <AdminTableCell>
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
                    </AdminTableCell>
                    <AdminTableCell>
                      {lead.assignee?.name ?? "Unassigned"}
                    </AdminTableCell>
                    <AdminTableCell align="right">
                      {lead.createdAt.toLocaleDateString()}
                    </AdminTableCell>
                  </AdminTableRow>
                ))
              )}
            </AdminTableBody>
          </AdminTable>
        </AdminTableFrame>
        <div className="flex items-center justify-between text-sm text-[var(--admin-text-secondary)]">
          <span>
            Page {filters.page} of {totalPages} · {total} lead{total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-3">
            <Link
              aria-disabled={filters.page === 1}
              className="underline disabled:pointer-events-none"
              href={previousHref}
            >
              Previous
            </Link>
            <Link
              aria-disabled={filters.page >= totalPages}
              className="underline"
              href={nextHref}
            >
              Next
            </Link>
          </div>
        </div>
      </AdminPageBody>
    </AdminPageContainer>
  );
}
