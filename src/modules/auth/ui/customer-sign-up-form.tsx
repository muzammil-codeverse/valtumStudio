"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

import { authClient } from "./auth-client";

export function CustomerSignUpForm(): React.JSX.Element {
  const [error, setError] = useState<string>();
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmPassword") ?? "");
    if (name.length < 2 || name.length > 120) {
      setError("Enter your full name.");
      return;
    }
    if (password.length < 14 || password.length > 128 || password !== confirmation) {
      setError("Use a password of at least 14 characters and confirm it correctly.");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/auth/sign-in?verified=1"
      });
      if (result.error !== null) {
        setError(
          "We could not process that registration. Try again or contact the studio."
        );
      } else {
        setCompleted(true);
      }
    } catch {
      setError("Registration is unavailable right now. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="auth-result" role="status">
        <span className="auth-result-symbol" aria-hidden="true">
          ✓
        </span>
        <h2>Check your inbox.</h2>
        <p>
          If your registration was accepted, we have sent a verification link. Verify
          your email before signing in. Your project space will be available once the
          studio assigns your account to an engagement.
        </p>
        <Link className="auth-action-link" href="/auth/sign-in">
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label htmlFor="customer-name">Full name</label>
      <input
        id="customer-name"
        name="name"
        autoComplete="name"
        minLength={2}
        maxLength={120}
        required
      />
      <label htmlFor="customer-email">Work email</label>
      <input
        id="customer-email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <label htmlFor="customer-password">Password</label>
      <input
        id="customer-password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={14}
        maxLength={128}
        required
      />
      <p className="auth-help">
        At least 14 characters. A password manager is recommended.
      </p>
      <label htmlFor="customer-password-confirm">Confirm password</label>
      <input
        id="customer-password-confirm"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={14}
        maxLength={128}
        required
      />
      {error ? (
        <p role="alert" aria-live="polite" className="auth-error">
          {error}
        </p>
      ) : null}
      <button disabled={submitting} type="submit">
        {submitting ? "Creating account…" : "Create customer account"}{" "}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="auth-bottom-note">
        By creating an account, you agree to the studio&apos;s{" "}
        <Link href="/privacy">privacy policy</Link>.
      </p>
    </form>
  );
}
