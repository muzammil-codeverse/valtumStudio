"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  CONSENT_STORAGE_KEY,
  createConsentRecord,
  readStoredConsent,
  type ConsentRecord
} from "./cookie-storage";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  __valtumAnalyticsLoaded?: boolean;
};

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** Basic consent mode: do not load analytics code at all before an affirmative choice. */
function applyAnalyticsChoice(allow: boolean): void {
  if (!MEASUREMENT_ID || !/^G-[A-Z0-9]+$/.test(MEASUREMENT_ID)) return;
  const browser = window as AnalyticsWindow;
  const layer = browser.dataLayer ?? [];
  browser.dataLayer = layer;
  if (!allow && browser.__valtumAnalyticsLoaded) {
    layer.push([
      "consent",
      "update",
      { analytics_storage: "denied", ad_storage: "denied",
        ad_user_data: "denied", ad_personalization: "denied" }
    ]);
    // An in-memory Google script cannot be reliably unloaded. Reload after revocation.
    window.location.reload();
    return;
  }
  if (!allow || browser.__valtumAnalyticsLoaded) return;
  layer.push([
    "consent",
    "default",
    { analytics_storage: "denied", ad_storage: "denied",
      ad_user_data: "denied", ad_personalization: "denied" }
  ]);
  layer.push([
    "consent",
    "update",
    { analytics_storage: "granted", ad_storage: "denied",
      ad_user_data: "denied", ad_personalization: "denied" }
  ]);
  layer.push(["js", new Date()]);
  layer.push(["config", MEASUREMENT_ID, { anonymize_ip: true }]);
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  tag.setAttribute("data-valtum-analytics", "true");
  document.head.appendChild(tag);
  browser.__valtumAnalyticsLoaded = true;
}

export function CookieConsent(): React.JSX.Element {
  const [loaded, setLoaded] = useState(false);
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [analytics, setAnalytics] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastPath = useRef<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const saved = readStoredConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
      setRecord(saved);
      setAnalytics(saved?.analytics ?? false);
    } catch {
      // Private browsing can disallow storage. Visitors can still choose for this visit.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || record === null) return;
    applyAnalyticsChoice(record.analytics);
  }, [loaded, record]);

  useEffect(() => {
    if (lastPath.current === null) {
      lastPath.current = pathname;
      return;
    }
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const browser = window as AnalyticsWindow;
    if (record?.analytics && browser.__valtumAnalyticsLoaded && MEASUREMENT_ID) {
      browser.dataLayer?.push(["config", MEASUREMENT_ID, { page_path: pathname }]);
    }
  }, [pathname, record]);

  function openSettings(): void {
    setAnalytics(record?.analytics ?? false);
    setShowPreferences(true);
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }

  useEffect(() => {
    window.addEventListener("valtum:open-cookie-preferences", openSettings);
    return () => window.removeEventListener("valtum:open-cookie-preferences", openSettings);
    // The event subscription remains stable throughout this shared public shell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  function saveChoice(allowAnalytics: boolean): void {
    const saved = createConsentRecord(allowAnalytics);
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Keep the choice in component state if storage is unavailable.
    }
    setRecord(saved);
    setShowPreferences(false);
    dialogRef.current?.close();
  }

  return (
    <>
      {loaded && !record && (
        <aside className="x-cookie-banner" aria-labelledby="cookie-banner-title">
          <div className="x-cookie-banner-content">
            <span className="x-cookie-eyebrow">A LITTLE PRIVACY, BY DESIGN</span>
            <h2 id="cookie-banner-title">Your visit. Your choice.</h2>
            <p>
              Essential storage keeps our site and secure areas working.
              Optional analytics is off unless you allow it. You can change
              your choice any time in the footer.
              {" "}
              <Link href="/cookies">How we use cookies</Link>
            </p>
          </div>
          <div className="x-cookie-banner-actions">
            <button type="button" className="x-cookie-button x-cookie-button--dark"
              onClick={() => saveChoice(true)}>Accept all</button>
            <button type="button" className="x-cookie-button x-cookie-button--light"
              onClick={() => saveChoice(false)}>Reject optional</button>
            <button type="button" className="x-cookie-button x-cookie-button--text"
              onClick={openSettings}>Manage preferences ↗</button>
          </div>
        </aside>
      )}
      <dialog ref={dialogRef} className="x-cookie-dialog"
        aria-labelledby="cookie-dialog-title"
        onClose={() => setShowPreferences(false)}>
        {showPreferences && (
          <div className="x-cookie-dialog-inner">
            <div className="x-cookie-dialog-header">
              <span className="x-cookie-eyebrow">PRIVACY / VALTUM STUDIO</span>
              <button type="button" onClick={() => dialogRef.current?.close()}
                aria-label="Close cookie preferences">×</button>
            </div>
            <h2 id="cookie-dialog-title">Cookie preferences.</h2>
            <p className="x-cookie-dialog-copy">
              Decide how your browser stores optional information. Essential
              storage cannot be switched off because it supports security
              and remembering your preferences.
            </p>
            <div className="x-cookie-option">
              <div>
                <h3>Essential storage</h3>
                <p>Secure sessions, spam protection and saving this choice.</p>
              </div>
              <span className="x-cookie-always">Always on</span>
            </div>
            <label className="x-cookie-option x-cookie-option--interactive">
              <div>
                <h3>Optional analytics</h3>
                <p>
                  Helps us understand how public pages are used if an analytics
                  provider is configured. No analytics tags run before consent.
                </p>
              </div>
              <input type="checkbox" checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)} />
            </label>
            <p className="x-cookie-dialog-note">
              We do not currently use advertising cookies.
              See our <Link href="/cookies" onClick={() => dialogRef.current?.close()}>
                cookie notice
              </Link> for details.
            </p>
            <div className="x-cookie-dialog-actions">
              <button type="button" onClick={() => saveChoice(false)}>
                Reject optional
              </button>
              <button type="button" onClick={() => saveChoice(analytics)}>
                Save my choices
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
