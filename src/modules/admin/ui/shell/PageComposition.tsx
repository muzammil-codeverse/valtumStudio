import type { ReactNode } from "react";

interface ComponentProps {
  children: ReactNode;
  className?: string;
}

export function AdminPageContainer({
  children,
  className = ""
}: ComponentProps): React.JSX.Element {
  return (
    <div
      className={`p-4 sm:p-6 lg:p-8 w-full max-w-(--breakpoint-2xl) mx-auto space-y-6 ${className}`}
    >
      {children}
    </div>
  );
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  actions,
  className = ""
}: AdminPageHeaderProps): React.JSX.Element {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--admin-border)] pb-5 ${className}`}
    >
      <div className="space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--admin-text)]">
          {title}
        </h1>
        {description ? (
          <p className="text-xs sm:text-sm text-[var(--admin-text-secondary)] leading-relaxed max-w-3xl">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}

export function AdminPageBody({
  children,
  className = ""
}: ComponentProps): React.JSX.Element {
  return <div className={`space-y-6 ${className}`}>{children}</div>;
}

export function AdminPageSection({
  children,
  className = ""
}: ComponentProps): React.JSX.Element {
  return <section className={`space-y-4 ${className}`}>{children}</section>;
}

export function AdminPageActions({
  children,
  className = ""
}: ComponentProps): React.JSX.Element {
  return <div className={`flex items-center gap-3 ${className}`}>{children}</div>;
}
