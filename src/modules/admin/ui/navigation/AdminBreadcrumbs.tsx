"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_ROUTES } from "../../application/route-registry";
import { ChevronRightIcon } from "../components/icons";

export function AdminBreadcrumbs(): React.JSX.Element {
  const pathname = usePathname();

  if (pathname === "/admin") {
    return (
      <nav
        aria-label="Breadcrumbs"
        className="text-xs text-[var(--admin-text-secondary)] font-medium"
      >
        <span>Dashboard</span>
      </nav>
    );
  }

  // Build breadcrumbs dynamically based on registry lookup
  const paths = pathname.split("/").filter(Boolean); // e.g. ["admin", "security", "sessions"]
  const breadcrumbItems: Array<{ label: string; href: string; isLast: boolean }> = [];

  // Home is always Dashboard
  breadcrumbItems.push({
    label: "Dashboard",
    href: "/admin",
    isLast: pathname === "/admin"
  });

  // Track path segment lookup
  let cumulativePath = "/admin";

  // Skip the first segment "admin" since it's already mapped to Dashboard
  for (let i = 1; i < paths.length; i++) {
    cumulativePath += `/${paths[i]}`;

    // Find matching route in registry
    const match = Object.values(ADMIN_ROUTES).find(
      (route) => route.path === cumulativePath
    );

    if (match) {
      breadcrumbItems.push({
        label: match.breadcrumbLabel,
        href: match.path,
        isLast: i === paths.length - 1
      });
    }
  }

  return (
    <nav
      aria-label="Breadcrumbs"
      className="flex items-center space-x-1.5 text-xs text-[var(--admin-text-secondary)] font-medium"
    >
      {breadcrumbItems.map((item, index) => (
        <div key={item.href} className="flex items-center space-x-1.5">
          {index > 0 ? (
            <ChevronRightIcon className="text-[var(--admin-text-muted)] w-3.5 h-3.5" />
          ) : null}
          {item.isLast ? (
            <span
              className="text-[var(--admin-text)] truncate max-w-[120px] sm:max-w-none"
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-[var(--admin-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] focus-visible:outline-offset-2"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
