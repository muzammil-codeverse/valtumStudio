"use client";

import { useRef, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const projectOptions = [
  { value: "NOT_SURE", label: "What would you like to build?", service: "NOT_SURE" },
  {
    value: "WEB_APPLICATION",
    label: "A web application or SaaS product",
    service: "WEB_APPLICATIONS"
  },
  {
    value: "INTERNAL_BUSINESS_SYSTEM",
    label: "A business system or internal tool",
    service: "BACKEND_OR_API_ENGINEERING"
  },
  {
    value: "MARKETPLACE_OR_BOOKING_PLATFORM",
    label: "A booking or marketplace platform",
    service: "WEB_APPLICATIONS"
  },
  {
    value: "AI_OR_AUTOMATION",
    label: "AI or workflow automation",
    service: "AI_AND_AUTOMATION"
  },
  {
    value: "WEBSITE",
    label: "A creative website or digital experience",
    service: "WEBSITES"
  },
  {
    value: "EXISTING_PRODUCT_IMPROVEMENT",
    label: "Improving an existing product",
    service: "TECHNICAL_CONSULTING"
  }
] as const;

export function ContactForm(): React.JSX.Element {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const request = useRef<{ signature: string; token: string } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (status === "submitting") return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const projectType = String(data.get("projectType") ?? "NOT_SURE");
    const selection = projectOptions.find((option) => option.value === projectType);
    const timeline = String(data.get("timeline") ?? "");
    const fields = {
      fullName: String(data.get("fullName") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      company: String(data.get("company") ?? ""),
      projectSummary: String(data.get("projectSummary") ?? ""),
      projectType: selection?.value ?? "NOT_SURE",
      timeline: timeline || undefined
    };
    const signature = JSON.stringify(fields);
    if (request.current?.signature !== signature) {
      request.current = { signature, token: crypto.randomUUID().replaceAll("-", "") };
    }

    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...fields,
          consent: data.get("consent") === "on",
          consentVersion: "valtum-contact-v3",
          honeypot: String(data.get("website") ?? ""),
          landingPageUrl: window.location.href,
          projectStage: "NOT_SURE",
          serviceInterests: [selection?.service ?? "NOT_SURE"],
          source: "WEBSITE_CONTACT",
          submissionToken: request.current.token
        })
      });
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Too many enquiries are arriving right now. Please try again shortly."
          );
        }
        throw new Error(
          "We couldn't send your enquiry. Your message is still here. Please try again."
        );
      }
      setStatus("success");
      request.current = null;
      form.reset();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn't send your enquiry. Please try again."
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" aria-live="polite" className="vx-success">
        <span aria-hidden="true">↗</span>
        <h2>Your enquiry is with us.</h2>
        <p>
          Thank you. We’ll review what you’ve shared and reply to the email address you
          provided.
        </p>
        <button type="button" onClick={() => setStatus("idle")}>
          Send another enquiry <span aria-hidden="true">↗</span>
        </button>
      </div>
    );
  }

  return (
    <form className="vx-form" action="/api/leads" method="post" onSubmit={submit}>
      <div className="vx-form-row">
        <label className="vx-field" htmlFor="contact-name">
          <span className="vx-visually-hidden">Your name</span>
          <input
            id="contact-name"
            name="fullName"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            minLength={2}
            maxLength={120}
            required
          />
        </label>
        <label className="vx-field" htmlFor="contact-company">
          <span className="vx-visually-hidden">Company (optional)</span>
          <input
            id="contact-company"
            name="company"
            type="text"
            placeholder="Company (optional)"
            autoComplete="organization"
            maxLength={160}
          />
        </label>
      </div>
      <label className="vx-field" htmlFor="contact-email">
        <span className="vx-visually-hidden">Email address</span>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          placeholder="Email address"
          required
        />
      </label>
      <label className="vx-field" htmlFor="contact-phone">
        <span className="vx-visually-hidden">Phone (optional)</span>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={32}
          placeholder="Phone (optional)"
        />
      </label>
      <label className="vx-field" htmlFor="contact-summary">
        <span className="vx-visually-hidden">
          Tell us about your project or challenge
        </span>
        <textarea
          id="contact-summary"
          name="projectSummary"
          placeholder="Tell us about your project or challenge"
          minLength={20}
          maxLength={5000}
          rows={4}
          required
        />
      </label>
      <div className="vx-form-row vx-form-row--options">
        <label className="vx-field vx-select" htmlFor="contact-project-type">
          <span className="vx-visually-hidden">Project type</span>
          <select id="contact-project-type" name="projectType" defaultValue="NOT_SURE">
            {projectOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="vx-field vx-select" htmlFor="contact-timeline">
          <span className="vx-visually-hidden">Timeline (optional)</span>
          <select id="contact-timeline" name="timeline" defaultValue="">
            <option value="">Timeline (optional)</option>
            <option value="AS_SOON_AS_POSSIBLE">As soon as possible</option>
            <option value="ONE_TO_THREE_MONTHS">Within 1–3 months</option>
            <option value="THREE_TO_SIX_MONTHS">Within 3–6 months</option>
            <option value="SIX_MONTHS_PLUS">Later than six months</option>
            <option value="FLEXIBLE">Flexible</option>
          </select>
        </label>
      </div>
      <div className="v-honey" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" name="website" autoComplete="off" tabIndex={-1} />
      </div>
      <label className="vx-consent">
        <input type="checkbox" name="consent" required />
        <span>
          I agree to Valtum Studio using these details to respond to my enquiry.{" "}
          <a href="/privacy">Privacy policy</a>.
        </span>
      </label>
      <button className="vx-submit" disabled={status === "submitting"} type="submit">
        {status === "submitting" ? "Sending…" : "Send enquiry"}
        <span aria-hidden="true">↗</span>
      </button>
      {status === "error" && (
        <p className="vx-form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
