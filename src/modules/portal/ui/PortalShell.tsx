import type { ReactNode } from "react";

import { PortalNavigation } from "./PortalNavigation";

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
        <PortalNavigation />
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
        <PortalNavigation mobile />
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
