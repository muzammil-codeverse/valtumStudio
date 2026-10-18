"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/modules/admin/ui/components/buttons";

import {
  archiveMediaAction,
  deleteMediaAction,
  restoreMediaAction,
  updateMediaMetadataAction
} from "../actions";

export function MediaDetailsForm({
  altText,
  assetId,
  caption,
  canDelete,
  credit,
  revision,
  status
}: Readonly<{
  altText: string | null;
  assetId: string;
  caption: string | null;
  canDelete: boolean;
  credit: string | null;
  revision: number;
  status: string;
}>): React.JSX.Element {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const run = async (operation: () => ReturnType<typeof archiveMediaAction>) => {
    setPending(true);
    const result = await operation();
    setPending(false);
    setMessage(result.ok ? "Saved." : result.message);
    if (result.ok) router.refresh();
  };

  return (
    <section className="mt-8 space-y-5 border-t border-[var(--admin-border)] pt-6">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          void run(() =>
            updateMediaMetadataAction({
              altText: String(values.get("altText") ?? ""),
              assetId,
              caption: String(values.get("caption") ?? ""),
              credit: String(values.get("credit") ?? ""),
              expectedRevision: revision
            })
          );
        }}
      >
        <h2 className="text-sm font-semibold">Metadata</h2>
        <label className="block text-xs">
          Alt text
          <textarea
            className="mt-1 block w-full rounded border p-2"
            defaultValue={altText ?? ""}
            name="altText"
            rows={3}
          />
        </label>
        <label className="block text-xs">
          Caption
          <textarea
            className="mt-1 block w-full rounded border p-2"
            defaultValue={caption ?? ""}
            name="caption"
            rows={3}
          />
        </label>
        <label className="block text-xs">
          Credit
          <textarea
            className="mt-1 block w-full rounded border p-2"
            defaultValue={credit ?? ""}
            name="credit"
            rows={2}
          />
        </label>
        <Button
          disabled={pending || status === "DELETED"}
          type="submit"
          variant="primary"
        >
          Save metadata
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {status === "READY" ? (
          <Button
            disabled={pending}
            onClick={() => void run(() => archiveMediaAction(assetId, revision))}
            type="button"
            variant="secondary"
          >
            Archive
          </Button>
        ) : null}
        {status === "ARCHIVED" ? (
          <Button
            disabled={pending}
            onClick={() => void run(() => restoreMediaAction(assetId, revision))}
            type="button"
            variant="secondary"
          >
            Restore
          </Button>
        ) : null}
        {canDelete && (status === "READY" || status === "ARCHIVED") ? (
          <Button
            disabled={pending}
            onClick={() => void run(() => deleteMediaAction(assetId, revision))}
            type="button"
            variant="danger"
          >
            Delete permanently
          </Button>
        ) : null}
      </div>
      {message ? (
        <p className="text-xs" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
