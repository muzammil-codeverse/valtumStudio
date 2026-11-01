import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TurningBook } from "./TurningBook";
const pages = [
  {
    title: "The starting point",
    body: "The original brief.",
    image: "/editorial/paper.webp",
    alt: "A notebook",
    note: "Begin here"
  },
  {
    title: "The next decision",
    body: "A considered direction.",
    image: "/editorial/sketch.webp",
    alt: "A drawing",
    note: "A new chapter"
  },
  {
    title: "Ready to build",
    body: "The working plan.",
    image: "/editorial/detail.webp",
    alt: "An interface review",
    note: "Continue the work"
  }
];
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("Physical journal navigation", () => {
  it("finishes a page turn before exposing the next spread and permits a jump to a named page", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    render(<TurningBook pages={pages} />);
    fireEvent.click(screen.getByRole("button", { name: /Page 3:/ }));
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(
      screen.getByRole("heading", { name: "The starting point" })
    ).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(850);
    });
    expect(screen.getByRole("heading", { name: "Ready to build" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Page 3:/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    act(() => {
      vi.advanceTimersByTime(850);
    });
    expect(
      screen.getByRole("heading", { name: "The starting point" })
    ).toBeInTheDocument();
  });
});
