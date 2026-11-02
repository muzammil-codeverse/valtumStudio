"use client";
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

import { CookieConsent } from "./CookieConsent";
import { PreviewMotionContext } from "./DevicePreview";
import { mountStudioMotion } from "./motion";
import { RouteSequence } from "./route-sequence";
import { mountSmoothScroll } from "./smooth-scroll";
import { StudioFooter } from "./StudioFooter";
const navigation = [
  ["Work", "/work"],
  ["Services", "/services"],
  ["Solutions", "/solutions"],
  ["Approach", "/approach"],
  ["Studio", "/studio"]
] as const;
export function StudioShell({ children }: { children: ReactNode }): React.JSX.Element {
  const pathname = usePathname(),
    router = useRouter();
  const [menu, setMenu] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    menuButton = useRef<HTMLButtonElement>(null),
    curtain = useRef<HTMLDivElement>(null),
    arrival = useRef<HTMLDivElement>(null),
    progress = useRef<SVGCircleElement>(null);
  const [destination, setDestination] = useState("Valtum Studio");
  const initialPath = useRef(pathname);
  const firstArrival = useRef(false),
    sequence = useRef(new RouteSequence()),
    routeFilm = useRef<gsap.core.Timeline | null>(null),
    safety = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () =>
      mountSmoothScroll(
        () =>
          document.body.style.overflow === "hidden" || sequence.current.phase !== "idle"
      ),
    []
  );
  useEffect(() => {
    const panel = dialog.current;
    if (menu) {
      panel?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      panel?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);
  useLayoutEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const cleanup = mountStudioMotion(scope);
    const panel = curtain.current;
    let cancelled = false;
    if (panel && sequence.current.phase === "covered") {
      // Reassert the closed state before the incoming route can paint.
      gsap.set(panel, { visibility: "visible", y: 0, yPercent: 0 });
      gsap.set(panel.querySelectorAll(".m-route-slice"), { y: 0, yPercent: 0 });
      const ready = Array.from(
        scope.querySelectorAll<HTMLImageElement>("main img[fetchpriority='high']")
      ).map((image) => image.decode().catch(() => undefined));
      ready.push(document.fonts.ready.then(() => undefined));
      const limit = new Promise<void>((resolve) => setTimeout(resolve, 1400));
      void Promise.race([Promise.allSettled(ready), limit]).then(() => {
        if (cancelled || !sequence.current.reveal()) return;
        if (safety.current) clearTimeout(safety.current);
        requestAnimationFrame(() => {
          if (cancelled) return;
          routeFilm.current = gsap
            .timeline({
              delay: 0.18,
              onComplete: () => {
                sequence.current.finish();
                panel.style.pointerEvents = "none";
                gsap.set(panel, { visibility: "hidden" });
              }
            })
            .to(panel.querySelector(".m-route-content"), {
              opacity: 0,
              y: -25,
              duration: 0.3,
              ease: "power2.in"
            })
            .to(
              panel.querySelectorAll(".m-route-slice"),
              {
                y: 0,
                yPercent: -101,
                duration: 0.95,
                stagger: 0.055,
                ease: "power3.inOut"
              },
              0.22
            );
        });
      });
    }
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [pathname]);
  useEffect(() => {
    const element = arrival.current;
    if (!element || pathname !== "/") return;
    if (
      initialPath.current !== "/" ||
      firstArrival.current ||
      sequence.current.phase !== "idle" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      element.style.display = "none";
      return;
    }
    firstArrival.current = true;
    let cancelled = false;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const images = Array.from(
      root.current?.querySelectorAll<HTMLImageElement>(
        "[data-cinema] img,.v-brand img"
      ) ?? []
    );
    let loaded = 0;

    const advance = () => {
      loaded++;
      if (progress.current)
        progress.current.style.strokeDashoffset = String(
          100 - (loaded / (images.length + 1)) * 100
        );
    };
    const tasks = images.map((image) =>
      image
        .decode()
        .catch(() => undefined)
        .then(advance)
    );
    tasks.push(document.fonts.ready.then(() => advance()));
    const limit = new Promise<void>((resolve) => setTimeout(resolve, 3500));
    const minimum = new Promise<void>((resolve) => setTimeout(resolve, 850));
    void Promise.all([Promise.race([Promise.allSettled(tasks), limit]), minimum]).then(
      () => {
        if (cancelled) return;
        const film = gsap.timeline({
          onComplete: () => {
            element.style.display = "none";
            document.body.style.overflow = previous;
          }
        });
        film.to(element.querySelector(".x-arrival-center"), {
          opacity: 0,
          y: -20,
          duration: 0.4
        });
        film.to(
          element.querySelector(".x-curtain-left"),
          { xPercent: -101, rotate: -4, duration: 1.25, ease: "power4.inOut" },
          0.15
        );
        film.to(
          element.querySelector(".x-curtain-right"),
          { xPercent: 101, rotate: 4, duration: 1.25, ease: "power4.inOut" },
          0.15
        );
      }
    );
    return () => {
      cancelled = true;
      gsap.killTweensOf(element.querySelectorAll("*"));
      document.body.style.overflow = previous;
    };
  }, [pathname]);
  useEffect(
    () => () => {
      if (safety.current) clearTimeout(safety.current);
      routeFilm.current?.kill();
    },
    []
  );
  return (
    <PreviewMotionContext.Provider value={false}>
      <div
        className="valtum x-shell"
        ref={root}
        onClickCapture={(event) => {
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          const anchor = (event.target as Element).closest("a");
          if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
          const url = new URL(anchor.href, window.location.href);
          if (
            url.origin !== window.location.origin ||
            url.pathname === pathname ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
          )
            return;
          event.preventDefault();
          event.stopPropagation();
          if (!sequence.current.begin()) return;
          setMenu(false);
          if (safety.current) clearTimeout(safety.current);
          const panel = curtain.current;
          if (!panel) {
            router.push(url.pathname + url.search + url.hash);
            sequence.current.finish();
            return;
          }
          router.prefetch(url.pathname);
          panel.style.pointerEvents = "auto";
          const routeName =
            navigation.find(([, href]) => url.pathname.startsWith(href))?.[0] ??
            (url.pathname === "/" ? "The studio" : "Let’s talk");
          setDestination(routeName);
          routeFilm.current?.kill();
          gsap.set(panel, { visibility: "visible", y: 0, yPercent: 0 });
          gsap.set(panel.querySelector(".m-route-content"), { opacity: 0, y: 30 });
          gsap.set(panel.querySelectorAll(".m-route-slice"), { y: 0, yPercent: 101 });
          routeFilm.current = gsap
            .timeline({
              onComplete: () => {
                sequence.current.covered(() => {
                  safety.current = setTimeout(() => {
                    routeFilm.current?.kill();
                    gsap.set(panel, { visibility: "hidden" });
                    panel.style.pointerEvents = "none";
                    sequence.current.finish();
                  }, 6000);
                  router.push(url.pathname + url.search + url.hash);
                });
              }
            })
            .to(panel.querySelectorAll(".m-route-slice"), {
              y: 0,
              yPercent: 0,
              duration: 0.82,
              stagger: 0.055,
              ease: "power3.inOut"
            })
            .to(
              panel.querySelector(".m-route-content"),
              { opacity: 1, y: 0, duration: 0.32, ease: "power2.out" },
              0.76
            );
        }}
      >
        <a href="#main-content" className="v-skip">
          Skip to content
        </a>
        <header className="v-header x-header">
          <Link aria-label="Valtum Studio home" className="v-brand" href="/">
            <Image
              src="/branding/valtum-horizontal-black.svg"
              alt="Valtum Studio"
              width={184}
              height={48}
              priority
            />
          </Link>
          <nav aria-label="Main navigation" className="v-desktop-nav">
            {navigation.map(([label, href]) => (
              <Link
                href={href}
                key={href}
                aria-current={pathname.startsWith(href) ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link className="v-header-cta" href="/contact">
            Let’s talk <span aria-hidden="true">↗</span>
          </Link>
          <button
            aria-expanded={menu}
            aria-controls="v-menu"
            aria-label={menu ? "Close navigation" : "Open navigation"}
            className="v-menu-toggle"
            onClick={() => setMenu(!menu)}
            ref={menuButton}
          >
            Menu <span aria-hidden="true">{menu ? "×" : "+"}</span>
          </button>
        </header>
        <dialog
          className="v-menu x-menu"
          id="v-menu"
          aria-label="Site navigation"
          ref={dialog}
          onCancel={() => setMenu(false)}
          onClose={() => {
            setMenu(false);
            menuButton.current?.focus();
          }}
        >
          <div className="x-menu-image">
            <Image
              src="/editorial/light.webp"
              alt="An architectural study in light"
              fill
              sizes="40vw"
            />
          </div>
          <div className="x-menu-content">
            <div className="v-menu-top">
              <span>Valtum Studio</span>
              <button onClick={() => setMenu(false)} aria-label="Close navigation">
                Close ×
              </button>
            </div>
            <nav aria-label="Expanded navigation">
              {[...navigation, ["Contact", "/contact"] as const].map(
                ([label, href]) => (
                  <Link href={href} key={href} onClick={() => setMenu(false)}>
                    {label}
                    <span aria-hidden="true">↗</span>
                  </Link>
                )
              )}
            </nav>
            <p>
              Australian roots. A shared ambition,
              <br />
              wherever the work takes us.
            </p>
          </div>
        </dialog>
        {children}
        <StudioFooter />
        <CookieConsent />
        <div
          className="v-route-curtain x-route-curtain"
          ref={curtain}
          aria-hidden="true"
        >
          <div className="m-route-slices">
            {Array.from({ length: 5 }, (_, i) => (
              <div className="m-route-slice" key={i} />
            ))}
          </div>
          <div className="m-route-content">
            <Image
              src="/branding/valtum-symbol-white.svg"
              alt=""
              width={60}
              height={60}
            />
            <span>{destination}</span>
            <div className="m-route-photo">
              <Image src="/editorial/sculpture.webp" alt="" fill sizes="220px" />
            </div>
          </div>
        </div>
        {pathname === "/" && (
          <div
            className="x-arrival"
            ref={arrival}
            aria-label="Preparing Valtum Studio"
            role="status"
          >
            <div className="x-curtain-left" />
            <div className="x-curtain-right" />
            <div className="x-arrival-center">
              <Image
                src="/branding/valtum-stacked-white.svg"
                alt="Valtum Studio"
                width={180}
                height={180}
                priority
              />
              <svg className="m-logo-spinner" viewBox="0 0 220 220" aria-hidden="true">
                <circle className="m-spinner-track" cx="110" cy="110" r="102" />
                <circle
                  className="m-spinner-progress"
                  cx="110"
                  cy="110"
                  r="102"
                  pathLength="100"
                  ref={progress}
                />
                <circle
                  className="m-spinner-orbit"
                  cx="110"
                  cy="110"
                  r="102"
                  pathLength="100"
                />
              </svg>
              <span className="v-sr-only">Loading the studio</span>
            </div>
          </div>
        )}
        <noscript>
          <style>{".x-arrival{display:none!important}"}</style>
        </noscript>
      </div>
    </PreviewMotionContext.Provider>
  );
}
export function FolioLink({
  href,
  children,
  className = ""
}: {
  href: string;
  image: string;
  alt: string;
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
