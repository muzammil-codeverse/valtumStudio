"use client";

import type { FormEvent } from "react";
import { useState } from "react";

export function ChangePasswordForm(): React.JSX.Element {
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (newPassword !== confirmation) {
      setError("The new password and confirmation must match.");
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    const response = await fetch("/api/security/password", {
      body: JSON.stringify({ currentPassword, newPassword }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
    const payload: unknown = await response.json().catch(() => null);
    setIsSubmitting(false);
    if (!response.ok) {
      setError(
        payload !== null &&
          typeof payload === "object" &&
          typeof (payload as { message?: unknown }).message === "string"
          ? (payload as { message: string }).message
          : "Password change could not be completed."
      );
      return;
    }
    window.location.assign("/auth/setup-two-factor");
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label htmlFor="currentPassword">Current password</label>
      <input
        autoComplete="current-password"
        id="currentPassword"
        name="currentPassword"
        required
        type="password"
      />
      <label htmlFor="newPassword">New password</label>
      <input
        autoComplete="new-password"
        id="newPassword"
        maxLength={128}
        minLength={14}
        name="newPassword"
        required
        type="password"
      />
      <p className="auth-help">
        Use 14–128 characters. Password managers and paste are supported.
      </p>
      <label htmlFor="confirmation">Confirm new password</label>
      <input
        autoComplete="new-password"
        id="confirmation"
        maxLength={128}
        minLength={14}
        name="confirmation"
        required
        type="password"
      />
      {error === undefined ? null : (
        <p aria-live="polite" className="auth-error" role="alert">
          {error}
        </p>
      )}
      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Changing password…" : "Change password"}
      </button>
    </form>
  );
}
