"use client";

import { type ReactNode, useState } from "react";

import type { Role } from "@/modules/auth/domain/roles";

import { AdminMobileDrawer } from "./AdminMobileDrawer";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

interface AdminShellProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
  children: ReactNode;
}

export function SkipLink(): React.JSX.Element {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--admin-surface)] focus:text-[var(--admin-text)] focus:border focus:border-[var(--admin-border-strong)] focus:rounded-md focus:shadow-md focus:outline-2 focus:outline-[var(--admin-accent)]"
    >
      Skip to main content
    </a>
  );
}

export function AdminShell({ user, children }: AdminShellProps): React.JSX.Element {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="admin-root min-h-screen bg-[var(--admin-canvas)] text-[var(--admin-text)] flex">
      {/* Skip to Main Content Link for accessibility */}
      <SkipLink />

      {/* Persistent Desktop Sidebar */}
      <div className="hidden lg:block lg:flex-shrink-0 lg:w-64 h-screen sticky top-0">
        <AdminSidebar user={user} />
      </div>

      {/* Off-canvas Mobile Drawer */}
      <AdminMobileDrawer
        user={user}
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main viewport flow */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AdminTopbar
          user={user}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        />

        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
