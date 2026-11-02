"use client";

import { useRef, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const interests = [
  {
    value: "WEB_APPLICATION",
    title: "A new digital product",
    detail: "Web app, SaaS or customer platform",
    service: "WEB_APPLICATIONS"
  },
  {
    value: "INTERNAL_BUSINESS_SYSTEM",
    title: "A better way to work",
    detail: "Internal tools and connected operations",
    service: "BACKEND_OR_API_ENGINEERING"
  },
  {
    value: "MARKETPLACE_OR_BOOKING_PLATFORM",
    title: "A booking or marketplace system",
    detail: "Reservations, workflows and transactions",
    service: "WEB_APPLICATIONS"
  },
  {
    value: "AI_OR_AUTOMATION",
    title: "AI or automation",
    detail: "Practical intelligence and less manual work",
    service: "AI_AND_AUTOMATION"
  },
  {
    value: "WEBSITE",
    title: "A distinctive digital experience",
    detail: "Creative websites with a purpose",
    service: "WEBSITES"
  },
  {
    value: "EXISTING_PRODUCT_IMPROVEMENT",
    title: "An existing product needs work",
    detail: "Rebuild, improve or rethink",
    service: "TECHNICAL_CONSULTING"
  },
  {
    value: "NOT_SURE",
    title: "Let's work it out together",
    detail: "The idea is early, but the problem is real",
    service: "NOT_SURE"
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
    const selection = interests.find((item) => item.value === projectType);
    const timeline = String(data.get("timeline") ?? "");
    const fields = {
      fullName: String(data.get("fullName") ?? ""),
      email: String(data.get("email") ?? ""),
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
          "We couldn't send your enquiry. Your words are still here. Please try again."
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
      <div role="status" aria-live="polite" className="vc-success">
        <span aria-hidden="true">↗</span>
        <h2>Your idea is with us.</h2>
        <p>
          Thank you for reaching out. We’ll review what you’ve shared and reply using
          the email address you provided.
        </p>
        <button type="button" onClick={() => setStatus("idle")}>
          Send another enquiry <span aria-hidden="true">↗</span>
        </button>
      </div>
    );
  }

  return (
    <form
      action="/api/leads"
      className="v-form vc-form"
      method="post"
      onSubmit={submit}
    >
      <div className="vc-form-intro">
        <h2>Tell us what you’re working through.</h2>
        <p>You only need a starting point. We’ll help make sense of the rest.</p>
      </div>
      <div className="vc-field-pair">
        <div className="v-field">
          <label htmlFor="contact-name">
            Your name <span aria-hidden="true">*</span>
          </label>
          <input
            autoComplete="name"
            id="contact-name"
            maxLength={120}
            minLength={2}
            name="fullName"
            placeholder="Your name"
            required
          />
        </div>
        <div className="v-field">
          <label htmlFor="contact-email">
            Email address <span aria-hidden="true">*</span>
          </label>
          <input
            autoComplete="email"
            id="contact-email"
            maxLength={254}
            name="email"
            placeholder="you@company.com"
            required
            type="email"
          />
        </div>
      </div>
      <div className="v-field">
        <label htmlFor="contact-company">
          Company or organization <span className="vc-optional">Optional</span>
        </label>
        <input
          autoComplete="organization"
          id="contact-company"
          maxLength={160}
          name="company"
          placeholder="Where you work"
        />
      </div>
      <fieldset className="vc-interest-fieldset">
        <legend>
          What do you have in mind? <span aria-hidden="true">*</span>
        </legend>
        <div className="vc-interest-grid">
          {interests.map((interest) => (
            <label className="vc-interest" key={interest.value}>
              <input
                type="radio"
                name="projectType"
                value={interest.value}
                defaultChecked={interest.value === "NOT_SURE"}
                required
              />
              <span className="vc-interest-copy">
                <strong>{interest.title}</strong>
                <small>{interest.detail}</small>
              </span>
              <span className="vc-interest-indicator" aria-hidden="true" />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="v-field">
        <label htmlFor="contact-summary">
          Tell us about the challenge <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-summary"
          maxLength={5000}
          minLength={20}
          name="projectSummary"
          placeholder="What's happening today? What would you like to be different?"
          required
          rows={5}
        />
        <p className="vc-field-hint">
          A few sentences are enough. At least 20 characters.
        </p>
      </div>
      <div className="v-field">
        <label htmlFor="contact-timeline">
          When would you like to begin? <span className="vc-optional">Optional</span>
        </label>
        <select id="contact-timeline" defaultValue="" name="timeline">
          <option value="">No timeline in mind yet</option>
          <option value="AS_SOON_AS_POSSIBLE">As soon as possible</option>
          <option value="ONE_TO_THREE_MONTHS">Within 1–3 months</option>
          <option value="THREE_TO_SIX_MONTHS">Within 3–6 months</option>
          <option value="SIX_MONTHS_PLUS">Later than six months</option>
          <option value="FLEXIBLE">Flexible</option>
        </select>
      </div>
      <div className="v-honey" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input autoComplete="off" id="contact-website" name="website" tabIndex={-1} />
      </div>
      <label className="v-consent vc-consent">
        <input name="consent" required type="checkbox" />
        <span>
          I agree to Valtum Studio using my details to respond to this enquiry. See our{" "}
          <a href="/privacy">privacy information</a>.
        </span>
      </label>
      <button
        className="v-submit vc-submit"
        disabled={status === "submitting"}
        type="submit"
      >
        {status === "submitting" ? "Sending your enquiry…" : "Start the conversation"}
        <span aria-hidden="true">↗</span>
      </button>
      {status === "error" && (
        <p className="v-form-status v-form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
