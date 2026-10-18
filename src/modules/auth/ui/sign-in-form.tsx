"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { authClient } from "./auth-client";

export function SignInForm(): React.JSX.Element {
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      callbackURL: "/admin",
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      rememberMe: false
    });
    setIsSubmitting(false);
    if (result.error !== null) {
      setError("Invalid email or password.");
      return;
    }
    if (
      result.data !== null &&
      result.data !== undefined &&
      "twoFactorRedirect" in result.data &&
      result.data.twoFactorRedirect === true
    ) {
      window.location.assign("/auth/two-factor");
      return;
    }
    window.location.assign("/auth/change-password");
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <label htmlFor="email">Email address</label>
      <input autoComplete="email" id="email" name="email" required type="email" />
      <label htmlFor="password">Password</label>
      <input
        autoComplete="current-password"
        id="password"
        name="password"
        required
        type="password"
      />
      {error === undefined ? null : (
        <p aria-live="polite" className="auth-error" role="alert">
          {error}
        </p>
      )}
      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
