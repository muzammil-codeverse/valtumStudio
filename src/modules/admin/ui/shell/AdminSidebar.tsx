"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Role } from "@/modules/auth/domain/roles";
import { can } from "@/modules/auth/policies/authorization";

import { ADMIN_ROUTES } from "../../application/route-registry";
import { AdminIcon } from "../components/icons";

interface AdminSidebarProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
  onCloseMobileDrawer?: () => void;
}

export function AdminSidebar({
  user,
  onCloseMobileDrawer
}: AdminSidebarProps): React.JSX.Element {
  const pathname = usePathname();

  // Group paths
  const groups = [
    { name: "Overview" as const, label: "Overview" },
    { name: "Content" as const, label: "Content" },
    { name: "Operations" as const, label: "Operations" },
    { name: "Administration" as const, label: "Administration" },
    { name: "Account" as const, label: "Account" }
  ];

  return (
    <aside className="w-64 bg-[var(--admin-surface)] border-r border-[var(--admin-border)] flex flex-col h-full overflow-y-auto">
      {/* Identity block */}
      <div className="h-16 px-6 border-b border-[var(--admin-border)] flex items-center gap-2">
        <span className="font-semibold text-sm tracking-wide text-[var(--admin-text)]">
          SIGLUM STUDIO
        </span>
        <span className="text-[10px] font-medium tracking-widest px-1.5 py-0.5 rounded-sm uppercase bg-[var(--admin-surface-subtle)] text-[var(--admin-text-secondary)] border border-[var(--admin-border)]">
          Admin
        </span>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-4 py-6 space-y-6" aria-label="Sidebar Navigation">
        {groups.map((group) => {
          // Filter routes under this group by permission
          const items = Object.values(ADMIN_ROUTES).filter(
            (route) =>
              route.group === group.name &&
              can(user.role, {
                resource: route.requiredResource,
                action: route.requiredAction
              })
          );

          if (items.length === 0) return null;

          return (
            <div key={group.name} className="space-y-2">
              <h3 className="px-3 text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">
                {group.label}
              </h3>
              <ul className="space-y-1">
                {items.map((item) => {
                  const isActive =
                    pathname === item.path ||
                    (item.path !== "/admin" && pathname.startsWith(item.path));

                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        {...(onCloseMobileDrawer
                          ? { onClick: onCloseMobileDrawer }
                          : {})}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] focus-visible:outline-offset-2 ${
                          isActive
                            ? "bg-[var(--admin-surface-selected)] text-[var(--admin-text)] border-l-2 border-[var(--admin-accent)] pl-2.5"
                            : "text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text)]"
                        }`}
                      >
                        <AdminIcon
                          name={item.iconKey}
                          className={
                            isActive
                              ? "text-[var(--admin-accent)]"
                              : "text-[var(--admin-text-muted)]"
                          }
                          size={18}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer Profile Mini Summary */}
      <div className="p-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface-subtle)]/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] font-semibold flex items-center justify-center text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--admin-text)] truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-[var(--admin-text-muted)] capitalize">
              {user.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
