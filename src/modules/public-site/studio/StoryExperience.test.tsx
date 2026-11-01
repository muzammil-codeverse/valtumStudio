import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { meanRevertingSeries } from "./experiments";
import { StoryExperience } from "./StoryExperience";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Project studies", () => {
  it("keeps a reservation unconfirmed until its simulated payment event", async () => {
    const user = userEvent.setup();
    render(<StoryExperience theme="lodge" />);
    expect(screen.queryByText("Reservation confirmed")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Place a temporary hold/ }));
    expect(screen.getByText(/Held for 15:00/)).toBeInTheDocument();
    expect(screen.queryByText("Reservation confirmed")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Receive simulated payment event/ })
    );
    expect(screen.getByText("Reservation confirmed")).toBeInTheDocument();
  });

  it("retains the parcel reference when the role changes", async () => {
    const user = userEvent.setup();
    render(<StoryExperience theme="courier" />);
    await user.click(screen.getByRole("button", { name: "Driver" }));
    expect(screen.getByText("DEMO / 001")).toBeInTheDocument();
    expect(screen.getByText("COLLECTED")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Driver" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("calculates a repeatable model rather than swapping decorative graphs", () => {
    expect(meanRevertingSeries(0.5)).toEqual(meanRevertingSeries(0.5));
    expect(meanRevertingSeries(0.5)).not.toEqual(meanRevertingSeries(0.9));
    render(<StoryExperience theme="math" />);
    const graph = screen.getByRole("img");
    const before = graph.querySelector(".v-calculated-path")?.getAttribute("d");
    fireEvent.change(screen.getByRole("slider", { name: /Persistence/ }), {
      target: { value: "0.9" }
    });
    expect(graph.querySelector(".v-calculated-path")?.getAttribute("d")).not.toBe(
      before
    );
    expect(screen.getByText("φ = 0.90")).toBeInTheDocument();
  });

  it("exposes all book pages through keyboard operable controls", async () => {
    const user = userEvent.setup();
    render(<StoryExperience theme="aegis" />);
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    screen.getByRole("button", { name: /Page 3:/ }).focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("heading", { name: "The history stays readable." })
    ).toBeInTheDocument();
  });

  it("distinguishes illustrative response contributions from an actual assessment", async () => {
    const user = userEvent.setup();
    render(<StoryExperience theme="personality" />);
    await user.click(screen.getByRole("button", { name: "Contributions" }));
    expect(
      screen.getByText("Illustrative relationships, not a scored assessment.")
    ).toBeInTheDocument();
  });
});
