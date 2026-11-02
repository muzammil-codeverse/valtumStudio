"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { CookieChoices } from "./cookie-policy";

type State = "loading" | "prompt" | "saved";

export function OpenCookiePreferences(): React.JSX.Element {
  return (
    <button
      type="button"
      className="vf-cookie-open"
      onClick={() => window.dispatchEvent(new Event("valtum:open-cookie-preferences"))}
    >
      Cookie preferences
    </button>
  );
}

export function CookiePreferences(): React.JSX.Element | null {
  const [state, setState] = useState<State>("loading");
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    void fetch("/api/cookie-consent", {
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your cookie preferences.");
        return (await response.json()) as { choices: CookieChoices | null };
      })
      .then((result) => {
        if (cancelled) return;
        const choices = result.choices;
        setAnalytics(choices?.analytics ?? false);
        setFunctional(choices?.functional ?? false);
        setState(choices === null ? "prompt" : "saved");
      })
      .catch(() => {
        if (!cancelled) setState("prompt");
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    function open(): void {
      if (dialog.current && !dialog.current.open) {
        dialog.current.showModal();
        setError("");
      }
    }
    window.addEventListener("valtum:open-cookie-preferences", open);
    return () => window.removeEventListener("valtum:open-cookie-preferences", open);
  }, []);

  async function save(nextAnalytics: boolean, nextFunctional: boolean): Promise<void> {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/cookie-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ analytics: nextAnalytics, functional: nextFunctional })
      });
      if (!response.ok)
        throw new Error("We couldn't save that preference. Please try again.");
      const payload = (await response.json()) as { choices: CookieChoices };
      setAnalytics(payload.choices.analytics);
      setFunctional(payload.choices.functional);
      setState("saved");
      dialog.current?.close();
      window.dispatchEvent(
        new CustomEvent("valtum:consent-changed", { detail: payload.choices })
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "We couldn't save that preference."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {state === "prompt" && (
        <aside className="vc-cookie-banner" aria-label="Cookie choices">
          <div className="vc-cookie-banner-top">
            <span>YOUR PRIVACY, YOUR CHOICE</span>
            <span aria-hidden="true">✳</span>
          </div>
          <h2>Cookies, thoughtfully handled.</h2>
          <p>
            We use essential storage for the site and to remember your choice. Optional
            analytics and preferences are off by default, and no optional tracking tools
            are currently active.
          </p>
          <div className="vc-cookie-actions">
            <button
              type="button"
              onClick={() => void save(false, false)}
              disabled={pending}
            >
              Reject optional
            </button>
            <button
              type="button"
              onClick={() => void save(true, true)}
              disabled={pending}
            >
              Accept all
            </button>
          </div>
          <div className="vc-cookie-secondary">
            <button type="button" onClick={() => dialog.current?.showModal()}>
              Manage preferences
            </button>
            <Link href="/cookies">Cookie policy ↗</Link>
          </div>
          {error && (
            <p className="vc-cookie-error" role="alert">
              {error}
            </p>
          )}
        </aside>
      )}
      <dialog
        className="vc-cookie-dialog"
        ref={dialog}
        aria-labelledby="vc-cookie-dialog-heading"
        onClose={() => setError("")}
      >
        <div className="vc-cookie-dialog-head">
          <span>Valtum Studio / Privacy</span>
          <button
            type="button"
            aria-label="Close cookie preferences"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <h2 id="vc-cookie-dialog-heading">Your preferences.</h2>
        <p>
          Choose what you are comfortable with. Essential storage is always enabled;
          optional choices stay off unless you allow them. No optional analytics or
          personalization scripts are currently installed.
        </p>
        <div className="vc-cookie-option">
          <div>
            <h3>Essential</h3>
            <p>Security, session handling and remembering this decision.</p>
          </div>
          <span>Always on</span>
        </div>
        <label className="vc-cookie-option">
          <div>
            <h3>Analytics</h3>
            <p>Permission for future usage measurement. Not currently active.</p>
          </div>
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => setAnalytics(e.target.checked)}
          />
        </label>
        <label className="vc-cookie-option">
          <div>
            <h3>Optional functionality</h3>
            <p>Permission for future personalization features. Not currently active.</p>
          </div>
          <input
            type="checkbox"
            checked={functional}
            onChange={(e) => setFunctional(e.target.checked)}
          />
        </label>
        <p className="vc-cookie-disclaimer">
          If we introduce materially different tracking technology, we'll update this
          policy and request fresh consent before enabling it.
        </p>
        {error && (
          <p className="vc-cookie-error" role="alert">
            {error}
          </p>
        )}
        <div className="vc-cookie-dialog-actions">
          <button
            type="button"
            disabled={pending}
            onClick={() => void save(false, false)}
          >
            Reject optional
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void save(analytics, functional)}
          >
            Save my choices
          </button>
        </div>
        <Link
          href="/cookies"
          className="vc-cookie-more"
          onClick={() => dialog.current?.close()}
        >
          Read the cookie policy ↗
        </Link>
      </dialog>
    </>
  );
}
