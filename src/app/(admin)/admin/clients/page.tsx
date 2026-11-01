import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { createClientWorkspaceAction } from "@/modules/portal/server/admin-actions";
import { isClientPortalEnabled } from "@/modules/portal/server/client-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Clients & Delivery | Valtum Studio",
  robots: { index: false }
};

export default async function AdminClientsPage(): Promise<React.JSX.Element> {
  if (!isClientPortalEnabled()) notFound();
  await requirePermission(await headers(), "clients", "read");
  const workspaces = await prisma.clientWorkspace.findMany({
    include: { _count: { select: { memberships: true, engagements: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return (
    <div className="ds-workspace">
      <div className="ds-hero">
        <div>
          <span className="ds-kicker">OPERATIONS / CUSTOMER DELIVERY</span>
          <h1>Clients & delivery.</h1>
          <p>Secure customer workspaces connected to real engagements, milestones and invoices.</p>
        </div>
        <span className="ds-health ds-health--ok">Private administration</span>
      </div>
      <div className="ds-bento-primary">
        <section className="ds-panel">
          <div className="ds-block-heading">
            <div><span className="ds-kicker">CUSTOMER ACCOUNTS</span><h2>Client workspaces</h2></div>
            <strong>{workspaces.length} total</strong>
          </div>
          {workspaces.length === 0 ? (
            <div className="ds-empty"><strong>No customer workspaces yet</strong><p>Start by creating a workspace for an actual contracted customer. No demo customers have been added.</p></div>
          ) : (
            <div className="ds-recent-list">
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="portal-row">
                  <div className="portal-row-main">
                    <Link href={"/admin/clients/" + workspace.id}>{workspace.name}</Link>
                    <small>{workspace._count.memberships} members · {workspace._count.engagements} engagements</small>
                  </div>
                  <Link className="ds-inline-link" href={"/admin/clients/" + workspace.id}>Manage ↗</Link>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="ds-panel">
          <div className="ds-block-heading">
            <div><span className="ds-kicker">NEW CLIENT</span><h2>Create a workspace</h2></div>
          </div>
          <p className="ds-footnote">Use the client’s actual organization name. Customer access is granted separately.</p>
          <form action={createClientWorkspaceAction} className="mt-6 grid gap-3">
            <label htmlFor="client-name" className="text-xs font-semibold">Client or organization name</label>
            <input
              id="client-name"
              name="name"
              minLength={2}
              maxLength={100}
              required
              placeholder="Registered client organization"
              className="w-full rounded-lg border border-[var(--admin-border-strong)] bg-white p-3 text-sm"
            />
            <button className="rounded-lg bg-[#5146bd] px-5 py-3 text-sm font-semibold text-white" type="submit">Create client workspace ↗</button>
          </form>
        </section>
      </div>
    </div>
  );
}
