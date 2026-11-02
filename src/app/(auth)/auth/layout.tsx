import "@/modules/auth/ui/auth.css";

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Your Workspace | Valtum Studio",
  robots: { index: false, follow: false, noarchive: true }
};

export default function AuthenticationLayout({
  children
}: Readonly<{ children: ReactNode }>): React.JSX.Element {
  return (
    <div className="valtum-auth-root">
      <aside className="auth-editorial">
        <Link href="/" className="auth-brand" aria-label="Valtum Studio home">
          <span className="auth-brand-mark" aria-hidden="true">
            V.
          </span>
          <span>Valtum Studio</span>
        </Link>
        <div className="auth-editorial-body">
          <h2>
            Good ideas.<em>Beautifully built.</em>
          </h2>
          <p>
            See your projects clearly. From the first conversation to the final detail.
          </p>
        </div>
        <footer className="auth-editorial-footer">
          <span>Independent thinking. Considered execution.</span>
          <span>Australia · Worldwide</span>
        </footer>
      </aside>
      <div className="auth-form-side">
        <header className="auth-form-top">
          <span>Valtum Studio workspace</span>
          <Link href="/">Back to the website</Link>
        </header>
        <main id="auth-main" className="auth-form-main">
          {children}
        </main>
        <footer className="auth-form-footer">
          <span>Private and securely managed</span>
          <Link href="/privacy">Privacy</Link>
          <a href="mailto:hello@valtumstudio.com.au">Contact</a>
        </footer>
      </div>
    </div>
  );
}
