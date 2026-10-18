"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { authClient } from "./auth-client";

export function TwoFactorForm(): React.JSX.Element {
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") ?? "");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator.");
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
    setIsSubmitting(false);
    if (result.error !== null) {
      setError("The verification code could not be accepted.");
      return;
    }
    window.location.assign("/auth/change-password");
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label htmlFor="code">Authenticator code</label>
      <input
        autoComplete="one-time-code"
        id="code"
        inputMode="numeric"
        maxLength={6}
        name="code"
        required
      />
      {error === undefined ? null : (
        <p aria-live="polite" className="auth-error" role="alert">
          {error}
        </p>
      )}
      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Verifying…" : "Verify"}
      </button>
    </form>
  );
}
