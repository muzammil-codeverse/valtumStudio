"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

type Reservation = {
  fileId: string;
  uploadUrl: string;
  headers: Record<string, string>;
};

async function jsonResponse(response: Response) {
  const value: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof value === "object" &&
      value !== null &&
      "message" in value &&
      typeof value.message === "string"
        ? value.message
        : "The file request could not be completed.";
    throw new Error(message);
  }
  return value;
}

export function DeliveryFileUploader({
  engagementId,
  pdfEnabled = false
}: Readonly<{ engagementId: string; pdfEnabled?: boolean }>): React.JSX.Element {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [failure, setFailure] = useState(false);

  async function upload(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const file = new FormData(form).get("file");
    if (!(file instanceof File) || file.size === 0) {
      setMessage("Select a file first.");
      setFailure(true);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Choose a file smaller than 10 MB.");
      setFailure(true);
      return;
    }
    const extension = file.name.toLowerCase().split(".").pop();
    const mime =
      file.type ||
      (extension === "pdf"
        ? "application/pdf"
        : extension === "png"
          ? "image/png"
          : extension === "jpg" || extension === "jpeg"
            ? "image/jpeg"
            : "");
    setBusy(true);
    setFailure(false);
    setMessage("Preparing your private upload…");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const checksum = await crypto.subtle.digest("SHA-256", bytes);
      const checksumSha256 = Array.from(new Uint8Array(checksum))
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("");
      const reserve = await fetch("/api/delivery/files/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          engagementId,
          filename: file.name,
          contentType: mime,
          byteSize: file.size,
          checksumSha256
        })
      });
      const details = (await jsonResponse(reserve)) as Reservation;
      setMessage("Uploading securely…");
      const put = await fetch(details.uploadUrl, {
        method: "PUT",
        headers: details.headers,
        body: file
      });
      if (!put.ok) throw new Error("Storage rejected the upload. Try again.");
      setMessage("Verifying your file…");
      const finalize = await fetch("/api/delivery/files/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ fileId: details.fileId })
      });
      await jsonResponse(finalize);
      form.reset();
      setMessage("File verified and shared with this project.");
      router.refresh();
    } catch (error) {
      setFailure(true);
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={upload} className="delivery-uploader">
      <label htmlFor={"project-file-" + engagementId}>Share a project file</label>
      <div className="delivery-uploader-row">
        <input
          id={"project-file-" + engagementId}
          type="file"
          name="file"
          accept={
            pdfEnabled
              ? ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              : ".jpg,.jpeg,.png,image/jpeg,image/png"
          }
          required
          disabled={busy}
        />
        <button disabled={busy} type="submit">
          {busy ? "Uploading…" : "Share file"}
        </button>
      </div>
      <p>
        {pdfEnabled
          ? "PDF, PNG or JPG. Up to 10 MB. Authorized members only."
          : "PNG or JPG, up to 10 MB. PDFs require additional document security checks."}
      </p>
      {message ? (
        <p role={failure ? "alert" : "status"} aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}
