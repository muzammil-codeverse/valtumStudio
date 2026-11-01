import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";

import { ServiceAccordion } from "./ServiceAccordion";
afterEach(cleanup);
it("exposes the selected service and a real detail destination through keyboard controls", async () => {
  const user = userEvent.setup();
  render(<ServiceAccordion />);
  const control = screen.getByRole("button", { name: /Intelligent systems/ });
  control.focus();
  await user.keyboard("{Enter}");
  expect(control).toHaveAttribute("aria-expanded", "true");
  expect(
    screen.getByRole("link", { name: /Explore intelligent systems/ })
  ).toHaveAttribute("href", "/services/intelligent-systems");
  expect(screen.queryByRole("link", { name: /Explore digital products/ })).toBeNull();
});
