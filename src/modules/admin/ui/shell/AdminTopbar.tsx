import type { Role } from "@/modules/auth/domain/roles";

import { MenuIcon } from "../components/icons";
import { AdminAccountMenu } from "../navigation/AdminAccountMenu";
import { AdminBreadcrumbs } from "../navigation/AdminBreadcrumbs";

interface AdminTopbarProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
  onOpenMobileDrawer: () => void;
}

export function AdminTopbar({
  user,
  onOpenMobileDrawer
}: AdminTopbarProps): React.JSX.Element {
  return (
    <header className="h-16 bg-[var(--admin-surface)] border-b border-[var(--admin-border)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileDrawer}
          aria-label="Open navigation menu"
          className="lg:hidden p-1.5 hover:bg-[var(--admin-surface-hover)] text-[var(--admin-text-secondary)] rounded-md focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] focus-visible:outline-offset-2"
        >
          <MenuIcon size={20} />
        </button>

        {/* Dynamic Breadcrumbs */}
        <AdminBreadcrumbs />
      </div>

      {/* Account Menu */}
      <AdminAccountMenu user={user} />
    </header>
  );
}
