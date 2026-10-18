"use client";

import { useRef, useState } from "react";

import { Button } from "@/modules/admin/ui/components/buttons";

import { finalizeMediaUploadAction, requestMediaUploadAction } from "../actions";

type UploadState =
  | "CANCELLED"
  | "COMPLETE"
  | "EXPIRED"
  | "FAILED"
  | "HASHING"
  | "IDLE"
  | "REQUESTING_UPLOAD"
  | "UPLOADING"
  | "VERIFYING";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function base64Digest(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function uploadToStorage(
  input: Readonly<{
    file: File;
    headers: Readonly<Record<string, string>>;
    onProgress: (progress: number) => void;
    signal: AbortSignal;
    url: string;
  }>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    input.signal.addEventListener("abort", abort, { once: true });
    request.open("PUT", input.url);
    request.timeout = 60_000;
    Object.entries(input.headers).forEach(([name, value]) =>
      request.setRequestHeader(name, value)
    );
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        input.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onerror = () =>
      reject(new Error("The storage upload could not be completed."));
    request.ontimeout = () => reject(new Error("The storage upload timed out."));
    request.onabort = () => reject(new DOMException("Upload cancelled.", "AbortError"));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error("The storage service rejected the upload."));
    };
    request.send(input.file);
  });
}

export function MediaUploader({
  onComplete
}: Readonly<{ onComplete?: () => void }>): React.JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<UploadState>("IDLE");
  const abortController = useRef<AbortController | null>(null);

  const selectFile = (selected: File | undefined) => {
    if (!selected) return;
    if (!acceptedTypes.has(selected.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (selected.size <= 0 || selected.size > 15 * 1024 * 1024) {
      setError("Choose an image no larger than 15 MiB.");
      return;
    }
    setError(null);
    setFile(selected);
    setProgress(0);
    setState("IDLE");
  };

  const upload = async () => {
    if (!file) return;
    try {
      setError(null);
      setState("HASHING");
      if (!globalThis.crypto?.subtle)
        throw new Error("This browser cannot calculate an upload checksum.");
      const checksumSha256 = base64Digest(
        await globalThis.crypto.subtle.digest("SHA-256", await file.arrayBuffer())
      );
      setState("REQUESTING_UPLOAD");
      const reservation = await requestMediaUploadAction({
        byteSize: file.size,
        checksumSha256,
        filename: file.name,
        mimeType: file.type,
        requestToken: globalThis.crypto.randomUUID()
      });
      if (!reservation.ok) {
        setState(reservation.code === "UPLOAD_EXPIRED" ? "EXPIRED" : "FAILED");
        setError(reservation.message);
        return;
      }
      const controller = new AbortController();
      abortController.current = controller;
      setState("UPLOADING");
      await uploadToStorage({
        file,
        headers: reservation.data.headers,
        onProgress: setProgress,
        signal: controller.signal,
        url: reservation.data.uploadUrl
      });
      setState("VERIFYING");
      const finalized = await finalizeMediaUploadAction({
        assetId: reservation.data.assetId,
        expectedRevision: reservation.data.revision
      });
      if (!finalized.ok) {
        setState(finalized.code === "UPLOAD_EXPIRED" ? "EXPIRED" : "FAILED");
        setError(finalized.message);
        return;
      }
      setState("COMPLETE");
      setProgress(100);
      onComplete?.();
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") {
        setState("CANCELLED");
        return;
      }
      setState("FAILED");
      setError(
        reason instanceof Error ? reason.message : "The upload could not be completed."
      );
    } finally {
      abortController.current = null;
    }
  };

  return (
    <section
      aria-labelledby="media-upload-heading"
      className="rounded-md border border-[var(--admin-border)] p-4"
    >
      <div className="mb-3">
        <h2 className="text-sm font-semibold" id="media-upload-heading">
          Upload image
        </h2>
        <p className="text-xs text-[var(--admin-text-secondary)]">
          JPEG, PNG, or WebP up to 15 MiB. Uploads are verified before appearing in the
          library.
        </p>
      </div>
      <label
        className="block cursor-pointer rounded border border-dashed border-[var(--admin-border-strong)] p-4 text-center text-xs"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          selectFile(event.dataTransfer.files.item(0) ?? undefined);
        }}
      >
        <span className="block">Drop an image here or choose a file</span>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.item(0) ?? undefined)}
          type="file"
        />
      </label>
      {file ? (
        <p className="mt-2 text-xs">
          {file.name} · {file.size.toLocaleString()} bytes
        </p>
      ) : null}
      {state === "UPLOADING" ? (
        <p className="mt-2 text-xs">Uploading: {progress}%</p>
      ) : null}
      {state === "VERIFYING" || state === "HASHING" || state === "REQUESTING_UPLOAD" ? (
        <p className="mt-2 text-xs">{state.replaceAll("_", " ").toLowerCase()}…</p>
      ) : null}
      {state === "COMPLETE" ? (
        <p className="mt-2 text-xs text-[var(--admin-success)]">
          Upload verified and added to the library.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-[var(--admin-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <Button
          disabled={
            !file ||
            ["HASHING", "REQUESTING_UPLOAD", "UPLOADING", "VERIFYING"].includes(state)
          }
          onClick={() => void upload()}
          type="button"
          variant="primary"
        >
          {state === "FAILED" || state === "EXPIRED" || state === "CANCELLED"
            ? "Retry upload"
            : "Upload"}
        </Button>
        <Button
          disabled={state !== "UPLOADING"}
          onClick={() => abortController.current?.abort()}
          type="button"
          variant="tertiary"
        >
          Cancel
        </Button>
      </div>
    </section>
  );
}
