import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes
} from "react";

export function AdminTableFrame({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={`w-full overflow-x-auto border border-[var(--admin-border)] rounded-lg bg-[var(--admin-surface)] shadow-2xs ${className}`}
    >
      {children}
    </div>
  );
}

export function AdminTable({
  children,
  className = "",
  ...props
}: TableHTMLAttributes<HTMLTableElement>): React.JSX.Element {
  return (
    <table
      className={`w-full text-left border-collapse text-xs ${className}`}
      {...props}
    >
      {children}
    </table>
  );
}

export function AdminTableHead({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): React.JSX.Element {
  return (
    <thead
      className={`bg-[var(--admin-surface-subtle)] border-b border-[var(--admin-border)] ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function AdminTableBody({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): React.JSX.Element {
  return (
    <tbody
      className={`divide-y divide-[var(--admin-border)] bg-[var(--admin-surface)] ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function AdminTableRow({
  children,
  className = "",
  isSelected = false,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { isSelected?: boolean }): React.JSX.Element {
  return (
    <tr
      className={`hover:bg-[var(--admin-surface-hover)]/40 transition-colors ${
        isSelected ? "bg-[var(--admin-surface-selected)]/50" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function AdminTableHeaderCell({
  children,
  className = "",
  align = "left",
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
}): React.JSX.Element {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th
      className={`px-4 py-3 font-semibold text-[var(--admin-text-secondary)] tracking-wider ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function AdminTableCell({
  children,
  className = "",
  align = "left",
  isPrimary = false,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
  isPrimary?: boolean;
}): React.JSX.Element {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const primaryClass = isPrimary
    ? "font-medium text-[var(--admin-text)] text-sm"
    : "text-[var(--admin-text-secondary)]";
  return (
    <td
      className={`px-4 py-3.5 align-middle ${alignClass} ${primaryClass} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export function AdminTableEmpty({
  colSpan,
  message = "No records found.",
  description
}: {
  colSpan: number;
  message?: string;
  description?: string;
}): React.JSX.Element {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-6 py-12 text-center bg-[var(--admin-surface)] text-[var(--admin-text-secondary)]"
      >
        <p className="text-sm font-medium text-[var(--admin-text)]">{message}</p>
        {description ? (
          <p className="text-xs text-[var(--admin-text-muted)] mt-1">{description}</p>
        ) : null}
      </td>
    </tr>
  );
}

export function AdminTableLoading({
  colSpan,
  rows = 3
}: {
  colSpan: number;
  rows?: number;
}): React.JSX.Element {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="animate-pulse bg-[var(--admin-surface)]">
          <td
            colSpan={colSpan}
            className="px-4 py-5 border-b border-[var(--admin-border)]"
          >
            <div className="h-4 bg-[var(--admin-surface-subtle)] rounded-sm w-3/4" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function TableToolbar({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--admin-border)] pb-4 mb-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function TablePaginationLayout({
  currentPage,
  totalPages,
  onPageChange,
  className = ""
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={`flex items-center justify-between border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3.5 sm:px-6 ${className}`}
    >
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="relative inline-flex items-center rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-4 py-2 text-xs font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface-hover)] disabled:opacity-50"
        >
          Previous
        </button>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="relative ml-3 inline-flex items-center rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-4 py-2 text-xs font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface-hover)] disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-[var(--admin-text-secondary)]">
            Showing Page{" "}
            <span className="font-semibold text-[var(--admin-text)]">
              {currentPage}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[var(--admin-text)]">
              {totalPages || 1}
            </span>
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-2xs"
            aria-label="Pagination"
          >
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] text-xs font-medium text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-hover)] disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] text-xs font-medium text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-hover)] disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
