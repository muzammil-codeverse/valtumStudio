import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/** Keep native page geometry; only interpolate wheel input on the shared clock. */
export function mountSmoothScroll(isBlocked: () => boolean): () => void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let dispose: (() => void) | undefined;
  const configure = () => {
    dispose?.();
    dispose = undefined;
    if (reducedMotion.matches) return;

    const scroll = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.085,
      wheelMultiplier: 1,
      anchors: { offset: -76 },
      stopInertiaOnNavigate: true,
      allowNestedScroll: true,
      prevent: (element) => Boolean(element.closest("dialog, [data-native-scroll]"))
    });
    const cancelInertia = () =>
      scroll.scrollTo(window.scrollY, { immediate: true, force: true });
    const keyboard = (event: KeyboardEvent) => {
      if (
        !["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(
          event.key
        )
      )
        return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea, select, [contenteditable='true']")
      )
        return;
      cancelInertia();
    };
    window.addEventListener("popstate", cancelInertia);
    window.addEventListener("keydown", keyboard);
    const unsubscribe = scroll.on("scroll", () => ScrollTrigger.update());
    const tick = (time: number) => {
      if (isBlocked()) {
        if (!scroll.isStopped) scroll.stop();
      } else if (scroll.isStopped) {
        scroll.start();
      }
      scroll.raf(time * 1000);
    };
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(tick);
    dispose = () => {
      window.removeEventListener("popstate", cancelInertia);
      window.removeEventListener("keydown", keyboard);
      gsap.ticker.remove(tick);
      unsubscribe();
      scroll.destroy();
      gsap.ticker.lagSmoothing(500, 33);
    };
  };
  configure();
  reducedMotion.addEventListener("change", configure);
  return () => {
    reducedMotion.removeEventListener("change", configure);
    dispose?.();
  };
}
