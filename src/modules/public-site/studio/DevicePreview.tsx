"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { productLinks } from "./product-links";
export const PreviewMotionContext = createContext(false);
export function DevicePreview({
  theme,
  title,
  phone = false,
  interactive = false,
  eager = false
}: {
  theme: string;
  title: string;
  phone?: boolean;
  interactive?: boolean;
  eager?: boolean;
}): React.JSX.Element {
  const [live, setLive] = useState(false),
    [visible, setVisible] = useState(false),
    [previewOnly, setPreviewOnly] = useState(false),
    [settled, setSettled] = useState(false);
  const paused = useContext(PreviewMotionContext),
    screen = useRef<HTMLDivElement>(null);
  const width = phone ? 390 : 1440,
    height = phone ? 844 : 900;
  useEffect(() => {
    const element = screen.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () =>
      element.style.setProperty("--preview-scale", String(element.clientWidth / width));
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    measure();
    if (typeof IntersectionObserver === "undefined") return () => resize.disconnect();
    const observer = new IntersectionObserver(
      ([entry]) => {
        setSettled(false);
        setVisible(
          Boolean(entry?.isIntersecting) &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        );
      },
      { rootMargin: "80px" }
    );
    observer.observe(element);
    return () => {
      resize.disconnect();
      observer.disconnect();
    };
  }, [width]);
  useEffect(() => {
    if (!visible || paused || live || previewOnly) return;
    let timer = 0;
    const ready = () => {
      setSettled(true);
      window.removeEventListener("scroll", waitForRest);
    };
    const waitForRest = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(ready, 360);
    };
    waitForRest();
    window.addEventListener("scroll", waitForRest, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", waitForRest);
    };
  }, [visible, paused, live, previewOnly]);
  return (
    <div className={`v-device-scene v-device-${theme}`}>
      <div className={`v-device ${phone ? "v-phone" : "v-laptop"}`} data-device>
        {phone && (
          <div className="v-phone-hardware" aria-hidden="true">
            <span className="v-phone-action" />
            <span className="v-phone-volume v-phone-volume-up" />
            <span className="v-phone-volume v-phone-volume-down" />
            <span className="v-phone-power" />
            <span className="v-phone-capture" />
          </div>
        )}
        <div className="v-device-lid">
          <div className="v-device-camera" aria-hidden="true" />
          <div
            className="v-device-screen"
            ref={screen}
            data-viewport={phone ? "mobile" : "desktop"}
            data-native-scroll={live || undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/products/${theme}${phone ? "-mobile" : ""}.webp`}
              alt={`${title} actual ${phone ? "mobile" : "desktop"} website`}
              width={width}
              height={height}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
            />
            {(live || (visible && settled && !paused && !previewOnly)) &&
              theme !== "courier" && (
                <iframe
                  src={productLinks[theme]}
                  title={`${title} ${live ? "live website" : "animated website preview"}`}
                  loading="lazy"
                  scrolling={live ? "auto" : "no"}
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  tabIndex={live ? 0 : -1}
                  aria-hidden={!live}
                  inert={!live}
                  style={{
                    width,
                    height,
                    pointerEvents: live ? "auto" : "none",
                    opacity: 0
                  }}
                  onLoad={(event) => {
                    event.currentTarget.style.opacity = "1";
                  }}
                />
              )}
          </div>
        </div>
        {!phone && (
          <div className="v-device-base" aria-hidden="true">
            <span />
          </div>
        )}
      </div>
      {interactive && (
        <div className="v-device-actions">
          {theme !== "courier" && (
            <button
              onClick={() => {
                setPreviewOnly(live);
                setLive(!live);
              }}
            >
              {live ? "Return to preview" : "Try the live website"}
              <span aria-hidden="true"> ↗</span>
            </button>
          )}
          <a href={productLinks[theme]} target="_blank" rel="noopener noreferrer">
            Open the website ↗
          </a>
          {live && (
            <p>
              Scroll inside the screen to explore. Open the website for a full browser
              view.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
