"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/modules/admin/ui/components/buttons";

import { findReadyMediaAction } from "../actions";
import type { MediaPickerItem } from "../server/queries";

export function MediaPicker({
  defaultValue,
  label,
  name
}: Readonly<{
  defaultValue?: string | null;
  label: string;
  name: string;
}>): React.JSX.Element {
  const [items, setItems] = useState<MediaPickerItem[]>([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(defaultValue ?? "");
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void findReadyMediaAction({ page, query }).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setError(null);
      setItems(result.data.items);
      setTotal(result.data.total);
    });
    return () => {
      active = false;
    };
  }, [page, query]);

  return (
    <fieldset className="space-y-3 rounded-md border border-[var(--admin-border)] p-4">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      <input name={name} type="hidden" value={selected} />
      <div className="flex gap-2">
        <input
          aria-label={`Search ${label}`}
          className="w-full rounded border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-3 py-2 text-xs"
          onChange={(event) => {
            setPage(1);
            setQuery(event.target.value);
          }}
          placeholder="Search ready media"
          value={query}
        />
        <Button onClick={() => setSelected("")} type="button" variant="tertiary">
          Clear
        </Button>
      </div>
      {error ? <p className="text-xs text-[var(--admin-danger)]">{error}</p> : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <button
            aria-pressed={selected === item.id}
            className={`rounded border p-2 text-left text-xs ${
              selected === item.id
                ? "border-[var(--admin-accent)] bg-[var(--admin-surface-hover)]"
                : "border-[var(--admin-border)]"
            }`}
            key={item.id}
            onClick={() => setSelected(item.id)}
            type="button"
          >
            {item.publicUrl ? (
              // This is a trusted, configuration-derived URL from a READY asset.
              <Image
                alt=""
                className="mb-2 aspect-video w-full rounded object-cover"
                height={item.height ?? 112}
                sizes="(max-width: 640px) 50vw, 25vw"
                src={item.publicUrl}
                width={item.width ?? 200}
              />
            ) : (
              <span className="mb-2 block aspect-video rounded bg-[var(--admin-surface-hover)]" />
            )}
            <span className="block truncate">{item.filename}</span>
            <span className="text-[var(--admin-text-muted)]">
              {item.width && item.height
                ? `${item.width} × ${item.height}`
                : item.mimeType}
            </span>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-[var(--admin-text-secondary)]">
        <span>{total} ready assets</span>
        <span className="flex gap-2">
          <Button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            type="button"
            variant="tertiary"
          >
            Previous
          </Button>
          <Button
            disabled={page * 20 >= total}
            onClick={() => setPage(page + 1)}
            type="button"
            variant="tertiary"
          >
            Next
          </Button>
        </span>
      </div>
    </fieldset>
  );
}
