import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DevicePreview, PreviewMotionContext } from "./DevicePreview";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("Actual product previews", () => {
  it("loads a local capture before a visitor opts into the external website", async () => {
    const user = userEvent.setup();
    render(<DevicePreview theme="aegis" title="Aegis Sentinel" interactive />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/products/aegis.webp");
    expect(document.querySelector("iframe")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Try the live website/ }));
    expect(screen.getByTitle("Aegis Sentinel live website")).toHaveAttribute(
      "src",
      "https://aegis-sentinel-tau.vercel.app/"
    );
    expect(screen.getByRole("link", { name: /Open the website/ })).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    );
    await user.click(screen.getByRole("button", { name: /Return to preview/ }));
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
  it("starts a visible website after scrolling settles and releases it when paused", () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      }
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(
          private callback: (entries: { isIntersecting: boolean }[]) => void
        ) {}
        observe() {
          this.callback([{ isIntersecting: true }]);
        }
        disconnect() {}
      }
    );
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const { rerender } = render(
      <PreviewMotionContext.Provider value={false}>
        <DevicePreview theme="aegis" title="Aegis Sentinel" />
      </PreviewMotionContext.Provider>
    );
    expect(document.querySelector("iframe")).toBeNull();
    act(() => vi.advanceTimersByTime(200));
    fireEvent.scroll(window);
    act(() => vi.advanceTimersByTime(200));
    expect(document.querySelector("iframe")).toBeNull();
    act(() => vi.advanceTimersByTime(161));
    expect(
      screen.getByTitle("Aegis Sentinel animated website preview")
    ).toHaveAttribute("inert");
    rerender(
      <PreviewMotionContext.Provider value={true}>
        <DevicePreview theme="aegis" title="Aegis Sentinel" />
      </PreviewMotionContext.Provider>
    );
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
  it("opens sites that disallow framing directly", () => {
    render(<DevicePreview theme="courier" title="KT Couriers" interactive />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://www.ktcouriers.com/"
    );
  });
  it("uses the responsive product capture for phone presentations", () => {
    render(<DevicePreview theme="lodge" title="Laugh & Lodge" phone />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/products/lodge-mobile.webp"
    );
    expect(screen.getByRole("img")).toHaveAttribute("width", "390");
    expect(screen.getByRole("img")).toHaveAttribute("height", "844");
  });
});
