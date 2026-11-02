import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { leadSubmissionSchema } from "@/modules/leads/domain/submission";

import { ContactForm } from "./ContactForm";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function fillForm(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Your name"), "Example Person");
  await user.type(screen.getByLabelText("Email address"), "example@example.com");
  await user.click(screen.getByRole("radio", { name: "AI and automation" }));
  await user.type(
    screen.getByLabelText(/Tell us what needs to change/),
    "A considered workflow for a new product idea."
  );
  await user.click(screen.getByRole("checkbox"));
  return user;
}

describe("Project enquiry", () => {
  it("submits a valid payload to the existing lead contract and shows the receipt", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetcher);
    render(<ContactForm />);
    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: /Send your enquiry/ }));
    expect(fetcher).toHaveBeenCalledOnce();
    const call = fetcher.mock.calls[0];
    if (!call) throw new Error("The form did not submit");
    const [url, options] = call;
    expect(url).toBe("/api/leads");
    const payload = JSON.parse(options.body);
    expect(leadSubmissionSchema.safeParse(payload).success).toBe(true);
    expect(payload.projectType).toBe("AI_OR_AUTOMATION");
    expect(payload.serviceInterests).toEqual(["AI_AND_AUTOMATION"]);
    expect(payload.consentVersion).toBe("valtum-contact-v3");
    expect(
      await screen.findByRole("heading", { name: "A good place to begin." })
    ).toBeInTheDocument();
  });

  it("preserves the enquiry and the idempotency token on a failed retry", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Network unavailable"));
    vi.stubGlobal("fetch", fetcher);
    render(<ContactForm />);
    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: /Begin a conversation/ }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByLabelText("Tell us a little about it")).toHaveValue(
      "A considered workflow for a new product idea."
    );
    await user.click(screen.getByRole("button", { name: /Begin a conversation/ }));
    const first = JSON.parse(fetcher.mock.calls[0]?.[1].body ?? "{}");
    const second = JSON.parse(fetcher.mock.calls[1]?.[1].body ?? "{}");
    expect(second.submissionToken).toBe(first.submissionToken);
  });
});
