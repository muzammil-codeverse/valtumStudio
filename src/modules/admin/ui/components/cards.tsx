import Link from "next/link";
import type { ReactNode } from "react";

interface CardBaseProps {
  children: ReactNode;
  className?: string;
}

// SurfaceCard: The core container card with borders and padding
export function SurfaceCard({
  children,
  className = ""
}: CardBaseProps): React.JSX.Element {
  return (
    <div
      className={`border border-[var(--admin-border)] bg-[var(--admin-surface)] rounded-lg p-5 shadow-2xs ${className}`}
    >
      {children}
    </div>
  );
}

export const Card = SurfaceCard;

export function CardHeader({
  title,
  description
}: {
  title: string;
  description?: string;
}): React.JSX.Element {
  return (
    <div className="mb-5 border-b border-[var(--admin-border)] pb-4">
      <h2 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h2>
      {description === undefined ? null : (
        <p className="mt-1 text-xs leading-relaxed text-[var(--admin-text-secondary)]">
          {description}
        </p>
      )}
    </div>
  );
}

export function CardContent({ children }: { children: ReactNode }): React.JSX.Element {
  return <div>{children}</div>;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  href?: string;
  statusDetails?: Array<{ label: string; count: number; colorClass?: string }>;
}

// MetricCard: For numerical aggregate statistics
export function MetricCard({
  label,
  value,
  subtext,
  href,
  statusDetails
}: MetricCardProps): React.JSX.Element {
  const cardContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        <span className="text-xs font-medium text-[var(--admin-text-secondary)] tracking-wide uppercase">
          {label}
        </span>
        <span className="block text-3xl font-semibold text-[var(--admin-text)] tracking-tight mt-1">
          {value}
        </span>
      </div>

      {statusDetails && statusDetails.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--admin-text-secondary)] border-t border-[var(--admin-border)] pt-3">
          {statusDetails.map((status, index) => (
            <span key={index} className="inline-flex items-center">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${status.colorClass ?? "bg-gray-400"}`}
              />
              {status.count} {status.label}
            </span>
          ))}
        </div>
      ) : subtext ? (
        <p className="text-xs text-[var(--admin-text-muted)] mt-2">{subtext}</p>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block border border-[var(--admin-border)] bg-[var(--admin-surface)] rounded-lg p-5 hover:border-[var(--admin-border-strong)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] focus-visible:outline-offset-2 shadow-2xs"
      >
        {cardContent}
      </Link>
    );
  }

  return <SurfaceCard>{cardContent}</SurfaceCard>;
}

interface NavigationCardProps {
  title: string;
  description: string;
  href: string;
  icon?: ReactNode;
}

// NavigationCard: For linking to specific functional workspaces
export function NavigationCard({
  title,
  description,
  href,
  icon
}: NavigationCardProps): React.JSX.Element {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 border border-[var(--admin-border)] bg-[var(--admin-surface)] rounded-lg p-5 hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-hover)]/30 transition-all focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] focus-visible:outline-offset-2 shadow-2xs"
    >
      {icon ? (
        <div className="flex items-center justify-center p-2 bg-[var(--admin-surface-subtle)] text-[var(--admin-accent)] rounded-md">
          {icon}
        </div>
      ) : null}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[var(--admin-text)] truncate">
          {title}
        </h3>
        <p className="text-xs text-[var(--admin-text-secondary)] mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}

interface SecurityCardProps {
  title: string;
  description: string;
  statusText?: string;
  href?: string;
  actionText?: string;
  icon?: ReactNode;
}

// SecurityCard: Focused on user security configurations
export function SecurityCard({
  title,
  description,
  statusText,
  href,
  actionText,
  icon
}: SecurityCardProps): React.JSX.Element {
  return (
    <SurfaceCard className="flex flex-col justify-between min-h-[140px]">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h3>
          {icon ? <div className="text-[var(--admin-text-muted)]">{icon}</div> : null}
        </div>
        <p className="text-xs text-[var(--admin-text-secondary)] mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[var(--admin-border)] pt-3">
        {statusText ? (
          <span className="text-xs font-medium text-[var(--admin-text-secondary)]">
            {statusText}
          </span>
        ) : (
          <span />
        )}

        {href && actionText ? (
          <Link
            href={href}
            className="text-xs font-medium text-[var(--admin-accent)] hover:underline hover:text-[var(--admin-accent-hover)] focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)]"
          >
            {actionText} &rarr;
          </Link>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

interface EmptyStateCardProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

// EmptyStateCard: Displayed when search lists or lists return no items
export function EmptyStateCard({
  title,
  description,
  actionText,
  onAction,
  icon
}: EmptyStateCardProps): React.JSX.Element {
  return (
    <div className="border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-subtle)]/40 rounded-lg p-8 flex flex-col items-center justify-center text-center">
      {icon ? <div className="text-[var(--admin-text-muted)] mb-3">{icon}</div> : null}
      <h3 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h3>
      <p className="text-xs text-[var(--admin-text-secondary)] mt-1 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionText && onAction ? (
        <button
          onClick={onAction}
          className="mt-4 text-xs font-medium text-[var(--admin-accent)] hover:underline hover:text-[var(--admin-accent-hover)] focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)]"
        >
          {actionText}
        </button>
      ) : null}
    </div>
  );
}
