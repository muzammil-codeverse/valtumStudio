import Link from "next/link";
import type { ReactNode } from "react";

type NavItem = Readonly<{ path: string; title: string; glyph: string }>;

const sections: NavItem[] = [
  { path: "/portal", title: "Overview", glyph: "▦" },
  { path: "/portal/projects", title: "Projects", glyph: "◈" },
  { path: "/portal/calendar", title: "Calendar", glyph: "▦" },
  { path: "/portal/invoices", title: "Invoices", glyph: "▤" },
  { path: "/portal/updates", title: "Updates", glyph: "◉" }
];

export function PortalShell({
  children,
  name,
  workspaces
}: {
  children: ReactNode;
  name: string;
  workspaces: ReadonlyArray<{ name: string; id: string }>;
}): React.JSX.Element {
  const initial = name.trim().charAt(0).toUpperCase() || "C";
  return (
    <div className="portal-root">
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <span className="portal-brand-mark">
            V<span>.</span>
          </span>
          <div>
            <strong>VALTUM</strong>
            <small>CLIENT SPACE</small>
          </div>
        </div>
        <div className="portal-nav-caption">YOUR WORKSPACE</div>
        <nav aria-label="Client portal navigation">
          {sections.map((section) => (
            <Link href={section.path} key={section.path}>
              <span aria-hidden="true">{section.glyph}</span>
              {section.title}
            </Link>
          ))}
        </nav>
        <div className="portal-sidebar-bottom">
          <div className="portal-help">
            <small>NEED SOMETHING?</small>
            <strong>We&apos;re here for the details.</strong>
            <a href="mailto:hello@valtumstudio.com.au">Talk to the studio ↗</a>
          </div>
          <div className="portal-account">
            <span>{initial}</span>
            <div>
              <strong>{name}</strong>
              <small>Client access</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="portal-main">
        <header className="portal-topbar">
          <div className="portal-topbar-label">
            VALTUM STUDIO <span>/</span> CLIENT EXPERIENCE
          </div>
          <div className="portal-workspace-name">
            {workspaces.length === 1
              ? workspaces[0]?.name
              : workspaces.length > 1
                ? workspaces.length + " workspaces"
                : "Your space"}
          </div>
        </header>
        <nav className="portal-mobile-nav" aria-label="Mobile client portal navigation">
          {sections.map((section) => (
            <Link href={section.path} key={section.path}>
              {section.title}
            </Link>
          ))}
        </nav>
        <main id="portal-main" className="portal-page">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PortalHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}): React.JSX.Element {
  return (
    <div className="portal-page-header">
      <div>
        <span className="portal-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="portal-page-action">{action}</div> : null}
    </div>
  );
}

export function PortalEmpty({
  title,
  description
}: {
  title: string;
  description: string;
}): React.JSX.Element {
  return (
    <div className="portal-empty">
      <span aria-hidden="true">✧</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
