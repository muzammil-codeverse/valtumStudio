"use client";

export function CookieSettingsButton(): React.JSX.Element {
  return (
    <button type="button" className="vf-cookie-settings"
      onClick={() => window.dispatchEvent(new Event("valtum:open-cookie-preferences"))}>
      Cookie preferences
    </button>
  );
}
