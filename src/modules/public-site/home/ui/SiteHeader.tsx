"use client";

import { useEffect, useRef, useState } from "react";

import { homeNavigation } from "../data/home-data";
import styles from "./home.module.css";

type SiteHeaderProperties = Readonly<{
  studioName: string;
}>;

export function SiteHeader({ studioName }: SiteHeaderProperties): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key !== "Tab") return;
      const panel = document.querySelector<HTMLElement>(`[data-mobile-menu="true"]`);
      const focusable = panel?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])"
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <header className={styles.header}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <div className={styles.headerInner}>
        <a aria-label={`${studioName} home`} className={styles.wordmark} href="#top">
          {studioName}
        </a>
        <nav aria-label="Primary navigation" className={styles.desktopNav}>
          {homeNavigation.slice(0, -1).map((item) => (
            <a className={styles.navLink} href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
          <a className={styles.navCta} href="#contact">
            Start a project
          </a>
        </nav>
        <button
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          className={styles.menuButton}
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <span aria-hidden="true">Menu</span>
        </button>
      </div>
      {isOpen ? (
        <div
          aria-label="Mobile navigation"
          aria-modal="true"
          className={`${styles.menuPanel} ${styles.menuPanelOpen}`}
          data-mobile-menu="true"
          id="mobile-navigation"
          role="dialog"
        >
          <button
            aria-label="Close navigation"
            className={styles.menuClose}
            onClick={() => setIsOpen(false)}
            ref={closeButton}
            type="button"
          >
            ×
          </button>
          <nav className={styles.menuLinks}>
            {homeNavigation.slice(0, -1).map((item) => (
              <a href={item.href} key={item.href} onClick={() => setIsOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>
          <a
            className={`${styles.buttonPrimary} ${styles.menuCta}`}
            href="#contact"
            onClick={() => setIsOpen(false)}
          >
            Start a project
          </a>
        </div>
      ) : null}
    </header>
  );
}
