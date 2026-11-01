import { describe, expect, it, vi } from "vitest";

import { RouteSequence } from "./route-sequence";

describe("Route cover sequence", () => {
  it("holds navigation until cover completion and rejects an early reveal", () => {
    const sequence = new RouteSequence();
    const navigate = vi.fn();
    expect(sequence.begin()).toBe(true);
    expect(sequence.reveal()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    sequence.covered(navigate);
    expect(navigate).toHaveBeenCalledOnce();
    expect(sequence.reveal()).toBe(true);
    expect(sequence.phase).toBe("revealing");
  });
  it("ignores repeated clicks and stale cover callbacks until the reveal finishes", () => {
    const sequence = new RouteSequence();
    const navigate = vi.fn();
    sequence.begin();
    expect(sequence.begin()).toBe(false);
    sequence.covered(navigate);
    sequence.covered(navigate);
    expect(navigate).toHaveBeenCalledOnce();
    sequence.reveal();
    expect(sequence.begin()).toBe(false);
    sequence.finish();
    expect(sequence.begin()).toBe(true);
  });
  it("recovers from an abandoned navigation without accepting its stale callback", () => {
    const sequence = new RouteSequence();
    const navigate = vi.fn();
    sequence.begin();
    sequence.finish();
    sequence.covered(navigate);
    expect(navigate).not.toHaveBeenCalled();
    expect(sequence.phase).toBe("idle");
  });
});
