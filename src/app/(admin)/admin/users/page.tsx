import type { Metadata } from "next";
import { headers } from "next/headers";

import { prisma } from "@/lib/database";
import { Badge, RoleBadge } from "@/modules/admin/ui/components/badges";
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

export const metadata: Metadata = {
  title: "Users | Valtum Studio Admin",
  description: "Manage Valtum Studio administrative user accounts."
};

export default async function UsersPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "users", "read");

  // Fetch real users (excluding banned)
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      emailVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
      lastSuccessfulLoginAt: true
    }
  });

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Users"
        description="Manage operator dashboard accounts, permission roles, authentication status, and account states. This area is restricted to the system owner."
      />
      <AdminPageBody>
        <div className="text-xs text-[var(--admin-text-secondary)] bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] rounded-md p-4">
          <p className="font-semibold text-[var(--admin-text)]">Workspace Notice</p>
          <p className="mt-1 leading-relaxed">
            User accounts are currently read-only. Role management, account creation,
            ban actions, and password resets are available via the CLI tooling.
            Management UI controls will be introduced in a later phase.
          </p>
        </div>

        <AdminTableFrame>
          <AdminTable>
            <AdminTableHead>
              <AdminTableRow>
                <AdminTableHeaderCell>Name</AdminTableHeaderCell>
                <AdminTableHeaderCell>Email</AdminTableHeaderCell>
                <AdminTableHeaderCell align="center">Role</AdminTableHeaderCell>
                <AdminTableHeaderCell align="center">2FA</AdminTableHeaderCell>
                <AdminTableHeaderCell align="center">
                  Account State
                </AdminTableHeaderCell>
                <AdminTableHeaderCell align="right">Last Login</AdminTableHeaderCell>
              </AdminTableRow>
            </AdminTableHead>
            <AdminTableBody>
              {users.length === 0 ? (
                <AdminTableEmpty
                  colSpan={6}
                  message="No user accounts found."
                  description="Use the bootstrap CLI script to create the first owner account."
                />
              ) : (
                users.map((user) => (
                  <AdminTableRow key={user.id}>
                    <AdminTableCell isPrimary>{user.name}</AdminTableCell>
                    <AdminTableCell className="text-[var(--admin-text-secondary)]">
                      {user.email}
                    </AdminTableCell>
                    <AdminTableCell align="center">
                      <RoleBadge role={user.role ?? "editor"} />
                    </AdminTableCell>
                    <AdminTableCell align="center">
                      {user.twoFactorEnabled ? (
                        <Badge variant="success">Enabled</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </AdminTableCell>
                    <AdminTableCell align="center">
                      {user.banned ? (
                        <Badge variant="danger">Banned</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </AdminTableCell>
                    <AdminTableCell
                      align="right"
                      className="text-[11px] text-[var(--admin-text-muted)]"
                    >
                      {user.lastSuccessfulLoginAt
                        ? new Date(user.lastSuccessfulLoginAt).toLocaleDateString()
                        : "Never"}
                    </AdminTableCell>
                  </AdminTableRow>
                ))
              )}
            </AdminTableBody>
          </AdminTable>
        </AdminTableFrame>
      </AdminPageBody>
    </AdminPageContainer>
  );
}
