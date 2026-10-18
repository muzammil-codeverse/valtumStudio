"use client";

import QRCode from "qrcode";
import type { FormEvent } from "react";
import { useState } from "react";

import { authClient } from "./auth-client";

type SetupState = Readonly<{
  backupCodes: readonly string[];
  qrCodeUrl: string;
  totpUri: string;
  verified: boolean;
}>;

export function SetupTwoFactor(): React.JSX.Element {
  const [error, setError] = useState<string>();
  const [setup, setSetup] = useState<SetupState>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function enable(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setError(undefined);
    setIsSubmitting(true);
    const result = await authClient.twoFactor.enable({ password });
    setIsSubmitting(false);
    if (result.error !== null || result.data === null) {
      setError("Two-factor setup could not be started.");
      return;
    }
    const qrCodeUrl = await QRCode.toDataURL(result.data.totpURI, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 224
    });
    setSetup({
      backupCodes: result.data.backupCodes,
      qrCodeUrl,
      totpUri: result.data.totpURI,
      verified: false
    });
  }

  async function verify(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator.");
      return;
    }
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
    if (result.error !== null) {
      setError("The verification code could not be accepted.");
      return;
    }
    setError(undefined);
    setSetup((current) =>
      current === undefined ? current : { ...current, verified: true }
    );
  }

  async function acknowledge(): Promise<void> {
    const response = await fetch("/api/security/recovery-codes/acknowledge", {
      method: "POST"
    });
    if (!response.ok) {
      setError("Recovery-code acknowledgement could not be saved.");
      return;
    }
    setSetup(undefined);
    window.location.assign("/admin");
  }

  if (setup === undefined) {
    return (
      <form className="auth-form" onSubmit={enable}>
        <p>
          Two-factor authentication is required before you can access administration.
        </p>
        <label htmlFor="password">Confirm your password</label>
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
          {isSubmitting ? "Preparing…" : "Set up authenticator"}
        </button>
      </form>
    );
  }

  if (!setup.verified) {
    return (
      <section className="auth-form">
        <h2>Scan this code</h2>
        {/* A generated data URI is intentionally not passed through remote image optimization. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="QR code for configuring Siglum Studio two-factor authentication"
          height={224}
          src={setup.qrCodeUrl}
          width={224}
        />
        <p>Or add this setup URI manually in your authenticator. Do not share it.</p>
        <output className="auth-code">{setup.totpUri}</output>
        <form onSubmit={verify}>
          <label htmlFor="code">Authenticator code</label>
          <input
            autoComplete="one-time-code"
            id="code"
            inputMode="numeric"
            maxLength={6}
            name="code"
            required
          />
          <button type="submit">Verify authenticator</button>
        </form>
        {error === undefined ? null : (
          <p aria-live="polite" className="auth-error" role="alert">
            {error}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="auth-form">
      <h2>Store your recovery codes</h2>
      <p>
        These codes are shown once. Store them in a secure password manager before
        continuing.
      </p>
      <ul className="auth-recovery-codes">
        {setup.backupCodes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      {error === undefined ? null : (
        <p aria-live="polite" className="auth-error" role="alert">
          {error}
        </p>
      )}
      <button onClick={acknowledge} type="button">
        I stored my recovery codes
      </button>
    </section>
  );
}
