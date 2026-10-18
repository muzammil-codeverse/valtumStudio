export default function AdminLoading(): React.JSX.Element {
  return (
    <div className="admin-root p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="border-b border-[var(--admin-border)] pb-5 space-y-3">
        <div className="h-7 bg-[var(--admin-surface-subtle)] rounded-md w-48" />
        <div className="h-4 bg-[var(--admin-surface-subtle)] rounded-md w-96 max-w-full" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border border-[var(--admin-border)] rounded-lg p-5 bg-[var(--admin-surface)] space-y-3"
          >
            <div className="h-3 bg-[var(--admin-surface-subtle)] rounded w-20" />
            <div className="h-8 bg-[var(--admin-surface-subtle)] rounded w-12" />
            <div className="border-t border-[var(--admin-border)] pt-3 flex gap-4">
              <div className="h-3 bg-[var(--admin-surface-subtle)] rounded w-16" />
              <div className="h-3 bg-[var(--admin-surface-subtle)] rounded w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Nav cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="border border-[var(--admin-border)] rounded-lg p-5 bg-[var(--admin-surface)] flex items-start gap-4"
          >
            <div className="w-9 h-9 bg-[var(--admin-surface-subtle)] rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-[var(--admin-surface-subtle)] rounded w-28" />
              <div className="h-3 bg-[var(--admin-surface-subtle)] rounded w-full" />
              <div className="h-3 bg-[var(--admin-surface-subtle)] rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
