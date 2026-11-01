"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
export function mountStudioMotion(scope: HTMLElement): () => void {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  const contextCleanups: Array<() => void> = [];
  media.add(
    {
      motion: "(prefers-reduced-motion: no-preference)",
      desktop: "(min-width:1001px)",
      phone: "(max-width:760px)"
    },
    (breakpoint) => {
      if (!breakpoint.conditions?.["motion"]) return;
      const context = gsap.context(() => {
        const cinema = scope.querySelector<HTMLElement>("[data-cinema]");
        if (cinema) {
          const sequence = gsap.timeline({
            scrollTrigger: {
              trigger: cinema,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.65,
              invalidateOnRefresh: true
            }
          });
          sequence.to({}, { duration: 0.3 });
          sequence.to(
            cinema.querySelector(".h-hero-copy"),
            { y: -45, autoAlpha: 0, duration: 0.35, ease: "power2.inOut" },
            0.3
          );
          sequence.to(
            cinema.querySelectorAll(".h-hero-browser,.h-hero-scroll"),
            { y: 20, autoAlpha: 0, duration: 0.28, ease: "power2.inOut" },
            0.3
          );
          sequence.to(
            cinema.querySelector(".h-hero-back-first"),
            {
              xPercent: -30,
              yPercent: -35,
              rotate: -20,
              opacity: 0,
              duration: 0.6,
              ease: "power2.inOut"
            },
            0.3
          );
          sequence.to(
            cinema.querySelector(".h-hero-back-last"),
            {
              xPercent: 30,
              yPercent: 35,
              rotate: 20,
              opacity: 0,
              duration: 0.6,
              ease: "power2.inOut"
            },
            0.3
          );
          sequence.to(
            cinema.querySelector(".h-hero-front"),
            { rotate: 0, duration: 0.7, ease: "power2.inOut" },
            0.45
          );
          sequence.to(
            cinema.querySelector(".h-hero-work"),
            {
              top: breakpoint.conditions?.["phone"] ? "76px" : "0%",
              left: "0%",
              right: "0%",
              height: () =>
                Math.min(
                  window.innerHeight,
                  cinema.querySelector<HTMLElement>(".h-hero-stage")?.clientHeight ??
                    window.innerHeight
                ) - (breakpoint.conditions?.["phone"] ? 76 : 0),
              duration: 1.05,
              ease: "power2.inOut"
            },
            0.45
          );
          sequence.to(
            cinema.querySelector(".h-hero-front .h-hero-image"),
            { inset: "0px", duration: 0.8, ease: "power2.inOut" },
            0.45
          );
          sequence.to(
            cinema.querySelector(".h-hero-front .h-hero-print-caption"),
            { opacity: 0, duration: 0.2 },
            0.45
          );
          sequence.to({}, { duration: 0.4 });
        }
        const fan = scope.querySelector<HTMLElement>(".m-service-fan");
        if (fan) {
          gsap.fromTo(
            fan.children,
            { rotate: 0, x: 0, xPercent: 0, y: 70 },
            {
              rotate: (i) => [-18, 2, 19][i] ?? 0,
              xPercent: (i) => [-34, 0, 34][i] ?? 0,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: fan,
                start: "top 90%",
                end: "top 10%",
                scrub: 0.8
              }
            }
          );
        }
        const strip = scope.querySelector(".m-solutions-strip");
        if (strip)
          gsap.fromTo(
            strip,
            { xPercent: 7, rotate: 3 },
            {
              xPercent: -8,
              rotate: -2,
              ease: "none",
              scrollTrigger: {
                trigger: strip,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.9
              }
            }
          );
        gsap.utils.toArray<HTMLElement>("[data-takeover]").forEach((scene) => {
          const film = gsap.timeline({
            scrollTrigger: {
              trigger: scene,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.8,
              invalidateOnRefresh: true
            }
          });
          film.to(
            scene.querySelector(".m-takeover-media"),
            { inset: "0% 0%", borderRadius: 0, duration: 0.65, ease: "power2.inOut" },
            0
          );
          film.fromTo(
            scene.querySelector(".m-takeover-media img"),
            { scale: 1.25 },
            { scale: 1, duration: 1, ease: "none" },
            0
          );
          film.fromTo(
            scene.querySelector(".m-takeover-copy"),
            { y: 85, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.35 },
            0.5
          );
          film.to({}, { duration: 0.25 });
        });
        gsap.utils.toArray<HTMLElement>(".m-practice-reel > div").forEach((reel) =>
          gsap.fromTo(
            reel,
            { xPercent: 4 },
            {
              xPercent: -28,
              ease: "none",
              scrollTrigger: {
                trigger: reel.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: 1
              }
            }
          )
        );
        gsap.utils.toArray<HTMLElement>(".m-inline-photo").forEach((photo) =>
          gsap.fromTo(
            photo,
            { clipPath: "inset(0 50% round 80px)", y: 15 },
            {
              clipPath: "inset(0 0% round 80px)",
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: photo,
                start: "top 95%",
                end: "top 55%",
                scrub: 0.6
              }
            }
          )
        );
        gsap.utils.toArray<HTMLElement>("[data-curtain-image]").forEach((photo) =>
          gsap.fromTo(
            photo,
            { clipPath: "inset(0 0 100% 0)", scale: 1.12 },
            {
              clipPath: "inset(0 0 0% 0)",
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: photo,
                start: "top 90%",
                end: "top 20%",
                scrub: 0.7
              }
            }
          )
        );

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) =>
          gsap.from(element, {
            y: 38,
            opacity: 0,
            duration: 1.05,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 94%", once: true }
          })
        );
        gsap.utils.toArray<HTMLElement>("[data-word-reveal]").forEach((element) => {
          const words = element.querySelectorAll(".x-word");
          gsap.fromTo(
            words.length ? words : element,
            { opacity: 0.6, y: words.length ? 0 : 25 },
            {
              opacity: 1,
              y: 0,
              stagger: words.length ? 0.06 : 0,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: "top 88%",
                end: "bottom 55%",
                scrub: 0.6
              }
            }
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) =>
          gsap.fromTo(
            element,
            { yPercent: -5, scale: 1.12 },
            {
              yPercent: 5,
              scale: 1.12,
              ease: "none",
              scrollTrigger: {
                trigger: element.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.8
              }
            }
          )
        );
        gsap.utils.toArray<HTMLElement>("[data-media-reveal]").forEach((element) =>
          gsap.fromTo(
            element,
            { clipPath: "inset(9% 7% 9% 7% round 30px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 0px)",
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: "top 90%",
                end: "top 22%",
                scrub: 0.8
              }
            }
          )
        );
        gsap.utils.toArray<HTMLElement>("[data-section-shift]").forEach((element) =>
          gsap.fromTo(
            element,
            { borderRadius: "60px 60px 0 0" },
            {
              borderRadius: "0px 0px 0 0",
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: "top 90%",
                end: "top 20%",
                scrub: true
              }
            }
          )
        );
        gsap.utils.toArray<HTMLElement>("[data-device-stage]").forEach((element) => {
          const device = element.querySelector("[data-device]");
          gsap.fromTo(
            device,
            { rotateX: 10, rotateY: -7, rotateZ: -2, scale: 0.91 },
            {
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: "top 90%",
                end: "bottom 35%",
                scrub: 0.8
              }
            }
          );
          const phone = element.querySelector(".x-pair-phone");
          if (phone)
            gsap.fromTo(
              phone,
              { y: 65, rotate: 8 },
              {
                y: 0,
                rotate: 2,
                ease: "none",
                scrollTrigger: {
                  trigger: element,
                  start: "top 85%",
                  end: "bottom 35%",
                  scrub: 0.8
                }
              }
            );
        });
        gsap.utils.toArray<HTMLElement>("[data-stack]").forEach((element, i) => {
          gsap.fromTo(
            element,
            { y: 70, rotate: i % 2 ? 1.4 : -1.4 },
            {
              y: 0,
              rotate: 0,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: "top 95%",
                end: "top 30%",
                scrub: 0.65
              }
            }
          );
        });
        if (breakpoint.conditions?.["desktop"]) {
          const chapters = scope.querySelectorAll<HTMLElement>(
            "main > section, main > header"
          );
          chapters.forEach((chapter, i) =>
            gsap.set(chapter, { position: "relative", zIndex: i + 1 })
          );
          gsap.utils.toArray<HTMLElement>("[data-cover-scene]").forEach((chapter) => {
            if (!chapter.nextElementSibling) return;
            // The following opaque section scrolls over this held scene.
            ScrollTrigger.create({
              trigger: chapter,
              refreshPriority: 1000 - Array.from(chapters).indexOf(chapter) * 10,
              start: "bottom bottom",
              end: () =>
                "+=" + Math.min(window.innerHeight * 0.8, chapter.offsetHeight),
              pin: true,
              pinSpacing: false,
              anticipatePin: 1,
              invalidateOnRefresh: true
            });
            gsap.to(chapter, {
              scale: 0.94,
              opacity: 0.4,
              transformOrigin: "center bottom",
              ease: "none",
              scrollTrigger: {
                trigger: chapter,
                start: "bottom bottom",
                end: "+=650",
                scrub: 0.8
              }
            });
          });

          const orbit = scope.querySelector<HTMLElement>("[data-orbit]");
          if (orbit) {
            const items = orbit.querySelectorAll<HTMLElement>(".x-orbit-image");
            const film = gsap.timeline({
              scrollTrigger: {
                trigger: orbit,
                refreshPriority: 1000 - Array.from(chapters).indexOf(orbit) * 10,
                start: "top top",
                end: "+=1200",
                pin: true,
                scrub: 0.65,
                anticipatePin: 1
              }
            });
            items.forEach((item, i) =>
              film.fromTo(
                item,
                {
                  x: i % 2 ? 160 : -160,
                  y: i < 4 ? -110 : 110,
                  rotate: i % 2 ? 22 : -22,
                  scale: 0.65
                },
                { x: 0, y: 0, rotate: i % 2 ? 9 : -9, scale: 1, duration: 1 },
                i * 0.035
              )
            );
            film.fromTo(
              orbit.querySelector(".x-orbit-copy"),
              { opacity: 0.25, scale: 0.93 },
              { opacity: 1, scale: 1, duration: 0.65 },
              0.2
            );
            film.to(items, { rotate: 0, scale: 0.93, duration: 0.4 }, 1.1);
            film.to({}, { duration: 0.35 });
          }
          const runway = scope.querySelector<HTMLElement>("[data-work-runway]");
          const windowElement =
            runway?.querySelector<HTMLElement>("[data-work-window]");
          const track = windowElement?.querySelector<HTMLElement>(".v-folio-grid");
          if (runway && windowElement && track) {
            const distance = () =>
              Math.max(0, track.scrollWidth - windowElement.clientWidth);
            const sizeRunway = () =>
              gsap.set(runway, {
                height:
                  window.innerHeight + distance() * 1.35 + window.innerHeight * 0.65
              });
            sizeRunway();
            ScrollTrigger.addEventListener("refreshInit", sizeRunway);
            const journey = gsap.timeline({
              scrollTrigger: {
                trigger: runway,
                start: "top top",
                end: "bottom bottom",
                scrub: 0.65,
                invalidateOnRefresh: true
              }
            });
            journey.to(
              track,
              { x: () => -distance(), duration: 1, ease: "none" },
              0.13
            );
            journey.to({}, { duration: 0.16 });
            contextCleanups.push(() =>
              ScrollTrigger.removeEventListener("refreshInit", sizeRunway)
            );
          }
        }
        ScrollTrigger.sort();
      }, scope);
      return () => {
        contextCleanups.splice(0).forEach((cleanup) => cleanup());
        context.revert();
      };
    }
  );
  const delayed = window.setTimeout(() => ScrollTrigger.refresh(), 400);
  let resizeTimer = 0;
  const observer =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 320);
        })
      : null;
  const content = scope.querySelector("main");
  if (content) observer?.observe(content);
  return () => {
    window.clearTimeout(delayed);
    window.clearTimeout(resizeTimer);
    observer?.disconnect();
    media.revert();
  };
}
