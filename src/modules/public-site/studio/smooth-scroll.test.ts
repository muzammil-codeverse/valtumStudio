import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mountSmoothScroll } from "./smooth-scroll";

const mocks = vi.hoisted(() => ({
  options: [] as Array<Record<string, unknown>>,
  scrollEvent: undefined as (() => void) | undefined,
  tick: undefined as ((time: number) => void) | undefined,
  scrollTo: vi.fn(),
  stop: vi.fn(),
  start: vi.fn(),
  raf: vi.fn(),
  destroy: vi.fn(),
  unsubscribe: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  lag: vi.fn()
}));
vi.mock("gsap", () => ({
  default: {
    ticker: {
      add: (tick: (time: number) => void) => {
        mocks.tick = tick;
      },
      remove: mocks.remove,
      lagSmoothing: mocks.lag
    }
  }
}));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: { update: mocks.update } }));
vi.mock("lenis", () => ({
  default: class {
    isStopped = false;
    constructor(options: Record<string, unknown>) {
      mocks.options.push(options);
    }
    on(_event: string, callback: () => void) {
      mocks.scrollEvent = callback;
      return mocks.unsubscribe;
    }
    scrollTo(...args: unknown[]) {
      mocks.scrollTo(...args);
    }
    stop() {
      this.isStopped = true;
      mocks.stop();
    }
    start() {
      this.isStopped = false;
      mocks.start();
    }
    raf(time: number) {
      mocks.raf(time);
    }
    destroy() {
      mocks.destroy();
    }
  }
}));

let preference: {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.options.length = 0;
  mocks.tick = undefined;
  preference = {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };
  vi.stubGlobal("matchMedia", () => preference);
});
afterEach(() => vi.unstubAllGlobals());

describe("Studio scrolling", () => {
  it("stops inertia behind a curtain and resumes from the current position", () => {
    let blocked = false;
    const cleanup = mountSmoothScroll(() => blocked);
    mocks.tick?.(1);
    expect(mocks.raf).toHaveBeenLastCalledWith(1000);
    blocked = true;
    mocks.tick?.(1.1);
    mocks.tick?.(1.2);
    expect(mocks.stop).toHaveBeenCalledTimes(1);
    blocked = false;
    mocks.tick?.(1.3);
    expect(mocks.start).toHaveBeenCalledTimes(1);
    mocks.scrollEvent?.();
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.options[0]).toMatchObject({
      autoRaf: false,
      syncTouch: false,
      stopInertiaOnNavigate: true
    });
    cleanup();
    expect(mocks.remove).toHaveBeenCalledWith(mocks.tick);
    expect(mocks.destroy).toHaveBeenCalledTimes(1);
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("discards wheel momentum for history and keyboard scrolling without blocking native keys", () => {
    const cleanup = mountSmoothScroll(() => false);
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(mocks.scrollTo).toHaveBeenLastCalledWith(window.scrollY, {
      immediate: true,
      force: true
    });
    const key = new KeyboardEvent("keydown", { key: "PageDown", cancelable: true });
    window.dispatchEvent(key);
    expect(mocks.scrollTo).toHaveBeenCalledTimes(2);
    expect(key.defaultPrevented).toBe(false);
    cleanup();
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(mocks.scrollTo).toHaveBeenCalledTimes(2);
  });

  it("releases wheel interception when reduced motion is enabled", () => {
    const cleanup = mountSmoothScroll(() => false);
    preference.matches = true;
    const changed = preference.addEventListener.mock.calls[0]?.[1] as () => void;
    changed();
    expect(mocks.destroy).toHaveBeenCalledTimes(1);
    expect(mocks.options).toHaveLength(1);
    cleanup();
    expect(mocks.destroy).toHaveBeenCalledTimes(1);
  });

  it("leaves scrolling native for a visitor who already prefers reduced motion", () => {
    preference.matches = true;
    const cleanup = mountSmoothScroll(() => false);
    expect(mocks.options).toHaveLength(0);
    expect(mocks.tick).toBeUndefined();
    cleanup();
  });
});
