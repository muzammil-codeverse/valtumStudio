"use client";

import Link from "next/link";
import { useEffect } from "react";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({
  error,
  reset
}: AdminErrorProps): React.JSX.Element {
  useEffect(() => {
    // Log the error without exposing it in the UI
    console.error("[Admin Error]", error.digest ?? "Unknown");
  }, [error]);

  return (
    <div className="admin-root p-8 flex items-start justify-center min-h-[60vh]">
      <div className="max-w-md w-full pt-12 text-center">
        <div className="w-12 h-12 bg-[var(--admin-danger)]/10 text-[var(--admin-danger)] rounded-lg flex items-center justify-center mx-auto mb-5">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-[var(--admin-text)]">
          Something went wrong
        </h1>
        <p className="text-sm text-[var(--admin-text-secondary)] mt-2 leading-relaxed">
          An unexpected problem occurred while loading this page. The issue has been
          recorded.
        </p>
        {error.digest ? (
          <p className="mt-3 text-[11px] font-mono text-[var(--admin-text-muted)] bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] rounded px-3 py-1.5 inline-block">
            Ref: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 text-sm font-medium border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] text-[var(--admin-text)] hover:bg-[var(--admin-surface-hover)] rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] focus-visible:outline-offset-2"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-[var(--admin-text)] text-[var(--admin-surface)] hover:opacity-90 rounded-md transition-opacity focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] focus-visible:outline-offset-2"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
