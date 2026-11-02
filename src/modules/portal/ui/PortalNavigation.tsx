"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  { path: "/portal", title: "Overview", glyph: "▦" },
  { path: "/portal/analytics", title: "Analytics", glyph: "◩" },
  { path: "/portal/projects", title: "Projects", glyph: "◈" },
  { path: "/portal/calendar", title: "Calendar", glyph: "▦" },
  { path: "/portal/invoices", title: "Invoices", glyph: "▤" },
  { path: "/portal/updates", title: "Updates", glyph: "◉" }
] as const;

export function PortalNavigation({
  mobile = false
}: {
  mobile?: boolean;
}): React.JSX.Element {
  const pathname = usePathname();
  return (
    <nav
      className={mobile ? "portal-mobile-nav" : undefined}
      aria-label={
        mobile ? "Mobile client portal navigation" : "Client portal navigation"
      }
    >
      {routes.map(({ path, title, glyph }) => {
        const active =
          pathname === path || (path !== "/portal" && pathname.startsWith(path + "/"));
        return (
          <Link
            href={path}
            key={path}
            aria-current={active ? "page" : undefined}
            className={active ? "portal-nav-current" : undefined}
          >
            <span aria-hidden="true">{glyph}</span>
            {title}
          </Link>
        );
      })}
    </nav>
  );
}
