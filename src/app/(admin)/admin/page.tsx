import type { Metadata } from "next";
import { headers } from "next/headers";

import { isDatabaseReady } from "@/lib/database";
import { ADMIN_ROUTES } from "@/modules/admin/application/route-registry";
import { fetchDashboardSummary } from "@/modules/admin/server/dashboard-queries";
import { RoleBadge } from "@/modules/admin/ui/components/badges";
import {
  MetricCard,
  NavigationCard,
  SecurityCard
} from "@/modules/admin/ui/components/cards";
import { AdminIcon, SecurityIcon } from "@/modules/admin/ui/components/icons";
import {
  AdminPageBody,
  AdminPageContainer,
  AdminPageSection
} from "@/modules/admin/ui/shell/PageComposition";
import { can } from "@/modules/auth/policies/authorization";
import { requireCompletedAuthentication } from "@/modules/auth/server/authorization";

export const metadata: Metadata = {
  title: "Dashboard | Siglum Studio Admin",
  description: "Private operations dashboard for Siglum Studio."
};

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const principal = await requireCompletedAuthentication(await headers());
  const summary = await fetchDashboardSummary(principal.role);
  const dbConnected = await isDatabaseReady();

  const user = {
    name: principal.name,
    email: principal.email,
    role: principal.role
  };

  // Group paths
  const navGroups = [
    { name: "Content" as const, label: "Content Management" },
    { name: "Operations" as const, label: "Operations" },
    { name: "Administration" as const, label: "Administration" }
  ];

  return (
    <AdminPageContainer>
      {/* Welcome and Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--admin-border)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--admin-text)]">
              Welcome back, {user.name}
            </h1>
            <RoleBadge role={user.role} />
          </div>
          <p className="text-xs sm:text-sm text-[var(--admin-text-secondary)] mt-1.5">
            Operating from the Siglum Studio private administration workspace.
          </p>
        </div>

        {/* System Readiness */}
        <div className="flex items-center gap-3 text-xs bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] rounded-md px-3 py-2 self-start md:self-auto">
          <span className="font-medium text-[var(--admin-text-secondary)]">
            System Status:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--admin-success)]" />
            <span className="text-[10px] text-[var(--admin-text-secondary)]">
              App Online
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${dbConnected ? "bg-[var(--admin-success)]" : "bg-[var(--admin-danger)]"}`}
            />
            <span className="text-[10px] text-[var(--admin-text-secondary)]">
              {dbConnected ? "DB Connected" : "DB Offline"}
            </span>
          </div>
        </div>
      </div>

      <AdminPageBody>
        {/* Metrics Grid */}
        <AdminPageSection>
          <h2 className="text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider mb-3">
            Overview Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {summary.services ? (
              <MetricCard
                label="Services"
                value={summary.services.total}
                statusDetails={[
                  {
                    count: summary.services.published,
                    label: "Published",
                    colorClass: "bg-[var(--admin-success)]"
                  },
                  {
                    count: summary.services.draft,
                    label: "Draft",
                    colorClass: "bg-gray-400"
                  }
                ]}
                href="/admin/services"
              />
            ) : null}

            {summary.projects ? (
              <MetricCard
                label="Projects"
                value={summary.projects.total}
                statusDetails={[
                  {
                    count: summary.projects.published,
                    label: "Published",
                    colorClass: "bg-[var(--admin-success)]"
                  },
                  {
                    count: summary.projects.draft,
                    label: "Draft",
                    colorClass: "bg-gray-400"
                  }
                ]}
                href="/admin/projects"
              />
            ) : null}

            {summary.mediaCount !== undefined ? (
              <MetricCard
                label="Media Assets"
                value={summary.mediaCount}
                subtext="Total files uploaded in library"
                href="/admin/media"
              />
            ) : null}

            {summary.leads ? (
              <MetricCard
                label="Leads Inquiries"
                value={summary.leads.total}
                statusDetails={[
                  {
                    count: summary.leads.newCount,
                    label: "New / Unread",
                    colorClass: "bg-[var(--admin-warning)]"
                  }
                ]}
                href="/admin/leads"
              />
            ) : null}

            {summary.usersCount !== undefined ? (
              <MetricCard
                label="Active Operators"
                value={summary.usersCount}
                subtext="Registered staff user accounts"
                href="/admin/users"
              />
            ) : null}
          </div>
        </AdminPageSection>

        {/* Management Areas Grouped */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {navGroups.map((group) => {
              // Filter routes in this group that the user has permission to read
              const items = Object.values(ADMIN_ROUTES).filter(
                (route) =>
                  route.group === group.name &&
                  (route.path as string) !== "/admin" &&
                  can(user.role, {
                    resource: route.requiredResource,
                    action: route.requiredAction
                  })
              );

              if (items.length === 0) return null;

              return (
                <AdminPageSection key={group.name}>
                  <h2 className="text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider mb-3">
                    {group.label}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map((item) => (
                      <NavigationCard
                        key={item.path}
                        title={item.label}
                        description={item.description}
                        href={item.path}
                        icon={<AdminIcon name={item.iconKey} size={18} />}
                      />
                    ))}
                  </div>
                </AdminPageSection>
              );
            })}
          </div>

          {/* Sidebar Area: Account & Security */}
          <div className="space-y-6">
            <AdminPageSection>
              <h2 className="text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider mb-3">
                Account & Security
              </h2>
              <div className="flex flex-col gap-4">
                <SecurityCard
                  title="Session Management"
                  description="Review your active administrative logins, active locations, and revoke old or unused browser sessions."
                  statusText="Revokable authentication sessions"
                  href="/admin/security/sessions"
                  actionText="Review Sessions"
                  icon={<SecurityIcon size={20} />}
                />
              </div>
            </AdminPageSection>
          </div>
        </div>
      </AdminPageBody>
    </AdminPageContainer>
  );
}
