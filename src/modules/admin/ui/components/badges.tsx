import type { ReactNode } from "react";

export type BadgeVariant =
  "default" | "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  children,
  className = ""
}: BadgeProps): React.JSX.Element {
  let colorStyles = "";

  switch (variant) {
    case "default":
      colorStyles =
        "bg-[var(--admin-surface-subtle)] border-[var(--admin-border)] text-[var(--admin-text-secondary)]";
      break;
    case "success":
      colorStyles =
        "bg-[var(--admin-success)]/10 border-[var(--admin-success)]/20 text-[var(--admin-success)]";
      break;
    case "warning":
      colorStyles =
        "bg-[var(--admin-warning)]/10 border-[var(--admin-warning)]/20 text-[var(--admin-warning)]";
      break;
    case "danger":
      colorStyles =
        "bg-[var(--admin-danger)]/10 border-[var(--admin-danger)]/20 text-[var(--admin-danger)]";
      break;
    case "info":
      colorStyles =
        "bg-[var(--admin-accent)]/10 border-[var(--admin-accent)]/20 text-[var(--admin-accent)]";
      break;
    case "neutral":
      colorStyles = "bg-gray-100 border-gray-200 text-gray-700";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorStyles} ${className}`}
    >
      {children}
    </span>
  );
}

// Helpers for specific domain values to make utilization cleaner
export function PublicationStatusBadge({
  status
}: {
  status: string;
}): React.JSX.Element {
  const norm = status.toUpperCase();
  if (norm === "PUBLISHED") {
    return <Badge variant="success">Published</Badge>;
  }
  if (norm === "ARCHIVED") {
    return <Badge variant="danger">Archived</Badge>;
  }
  return <Badge variant="default">Draft</Badge>;
}

export function RoleBadge({ role }: { role: string }): React.JSX.Element {
  const norm = role.toLowerCase();
  if (norm === "owner") {
    return (
      <Badge variant="danger" className="uppercase tracking-wider font-semibold">
        Owner
      </Badge>
    );
  }
  if (norm === "admin") {
    return (
      <Badge variant="info" className="uppercase tracking-wider font-semibold">
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="uppercase tracking-wider">
      Editor
    </Badge>
  );
}

export function LeadStatusBadge({ status }: { status: string }): React.JSX.Element {
  const norm = status.toUpperCase();
  switch (norm) {
    case "NEW":
      return <Badge variant="warning">New</Badge>;
    case "CONTACTED":
      return <Badge variant="info">Contacted</Badge>;
    case "QUALIFIED":
      return <Badge variant="success">Qualified</Badge>;
    case "WON":
      return <Badge variant="success">Won</Badge>;
    case "LOST":
    case "SPAM":
      return <Badge variant="danger">{norm === "SPAM" ? "Spam" : "Lost"}</Badge>;
    case "CONTACTED":
    case "DISCOVERY":
    case "PROPOSAL":
      return <Badge variant="info">{norm.replaceAll("_", " ")}</Badge>;
    case "IN_REVIEW":
      return <Badge variant="warning">In review</Badge>;
    case "CLOSED":
    default:
      return <Badge variant="default">Closed</Badge>;
  }
}
