import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import {
  CLIENT_DIRECTORY_PAGE_SIZE,
  clientDirectoryUrl,
  parseClientDirectoryQuery
} from "@/modules/portal/domain/directory-query";
import { createClientWorkspaceAction } from "@/modules/portal/server/admin-actions";
import { isClientPortalEnabled } from "@/modules/portal/server/client-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Clients & Delivery | Valtum Studio",
  robots: { index: false }
};

export default async function AdminClientsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}): Promise<React.JSX.Element> {
  if (!isClientPortalEnabled()) notFound();
  await requirePermission(await headers(), "clients", "read");
  const { search, page, skip } = parseClientDirectoryQuery(await searchParams);
  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};
  const [count, workspaces] = await Promise.all([
    prisma.clientWorkspace.count({ where }),
    prisma.clientWorkspace.findMany({
      where,
      include: { _count: { select: { memberships: true, engagements: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: CLIENT_DIRECTORY_PAGE_SIZE
    })
  ]);
  const pages = Math.ceil(count / CLIENT_DIRECTORY_PAGE_SIZE);
  return (
    <div className="ds-workspace">
      <div className="ds-hero">
        <div>
          <span className="ds-kicker">OPERATIONS / CUSTOMER DELIVERY</span>
          <h1>Clients & delivery.</h1>
          <p>
            Secure customer workspaces connected to real engagements, milestones and
            invoices.
          </p>
        </div>
        <span className="ds-health ds-health--ok">Private administration</span>
      </div>
      <div className="ds-bento-primary">
        <section className="ds-panel">
          <div className="ds-block-heading">
            <div>
              <span className="ds-kicker">CUSTOMER ACCOUNTS</span>
              <h2>Client workspaces</h2>
            </div>
            <strong>{count} total</strong>
          </div>
          <form
            method="get"
            action="/admin/clients"
            className="ds-directory-search"
            role="search"
          >
            <label htmlFor="client-directory-search">Find a client workspace</label>
            <div className="ds-directory-search-row">
              <input
                id="client-directory-search"
                type="search"
                name="q"
                defaultValue={search}
                maxLength={80}
                placeholder="Search by organization name"
              />
              <button type="submit">Search</button>
              {search ? <Link href="/admin/clients">Clear</Link> : null}
            </div>
            <p role="status">
              {count} matching client {count === 1 ? "workspace" : "workspaces"}
            </p>
          </form>
          {workspaces.length === 0 ? (
            <div className="ds-empty">
              <strong>No customer workspaces yet</strong>
              <p>
                {search
                  ? "No client workspaces match this search. Clear the filter to see all clients."
                  : "Create a workspace for an actual contracted customer. No demo clients have been added."}
              </p>
            </div>
          ) : (
            <div className="ds-recent-list">
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="portal-row">
                  <div className="portal-row-main">
                    <Link href={"/admin/clients/" + workspace.id}>
                      {workspace.name}
                    </Link>
                    <small>
                      {workspace._count.memberships} members ·{" "}
                      {workspace._count.engagements} engagements
                    </small>
                  </div>
                  <Link
                    className="ds-inline-link"
                    href={"/admin/clients/" + workspace.id}
                  >
                    Manage ↗
                  </Link>
                </div>
              ))}
            </div>
          )}
          {pages > 1 ? (
            <nav
              className="ds-directory-pagination"
              aria-label="Client directory pages"
            >
              <span>
                Page {page} of {pages}
              </span>
              {page > 1 ? (
                <Link href={clientDirectoryUrl(search, page - 1)}>Previous</Link>
              ) : null}
              {page < pages ? (
                <Link href={clientDirectoryUrl(search, page + 1)}>Next</Link>
              ) : null}
            </nav>
          ) : null}
        </section>
        <section className="ds-panel">
          <div className="ds-block-heading">
            <div>
              <span className="ds-kicker">NEW CLIENT</span>
              <h2>Create a workspace</h2>
            </div>
          </div>
          <p className="ds-footnote">
            Use the client’s actual organization name. Customer access is granted
            separately.
          </p>
          <form action={createClientWorkspaceAction} className="mt-6 grid gap-3">
            <label htmlFor="client-name" className="text-xs font-semibold">
              Client or organization name
            </label>
            <input
              id="client-name"
              name="name"
              minLength={2}
              maxLength={100}
              required
              placeholder="Registered client organization"
              className="w-full rounded-lg border border-[var(--admin-border-strong)] bg-white p-3 text-sm"
            />
            <button
              className="rounded-lg bg-[#5146bd] px-5 py-3 text-sm font-semibold text-white"
              type="submit"
            >
              Create client workspace ↗
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
