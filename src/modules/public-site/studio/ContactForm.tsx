"use client";

import { useRef, useState } from "react";

import type { LeadSubmission } from "@/modules/leads/domain/submission";

type Status = "idle" | "submitting" | "success" | "error";

const projectOptions = [
  { value: "WEB_APPLICATION", label: "A digital product or SaaS" },
  { value: "INTERNAL_BUSINESS_SYSTEM", label: "An internal business system" },
  { value: "MARKETPLACE_OR_BOOKING_PLATFORM", label: "Bookings or a marketplace" },
  { value: "AI_OR_AUTOMATION", label: "AI and automation" },
  { value: "EXISTING_PRODUCT_IMPROVEMENT", label: "Improve an existing product" },
  { value: "WEBSITE", label: "A distinctive website" },
  { value: "ANDROID_OR_FLUTTER", label: "A mobile application" },
  { value: "NOT_SURE", label: "Still exploring" }
] as const satisfies ReadonlyArray<{
  value: LeadSubmission["projectType"];
  label: string;
}>;

function interestForType(
  type: LeadSubmission["projectType"]
): LeadSubmission["serviceInterests"][number] {
  const interests: Partial<Record<LeadSubmission["projectType"], LeadSubmission["serviceInterests"][number]>> = {
    WEB_APPLICATION: "WEB_APPLICATIONS",
    INTERNAL_BUSINESS_SYSTEM: "BACKEND_OR_API_ENGINEERING",
    MARKETPLACE_OR_BOOKING_PLATFORM: "WEB_APPLICATIONS",
    AI_OR_AUTOMATION: "AI_AND_AUTOMATION",
    EXISTING_PRODUCT_IMPROVEMENT: "WEB_APPLICATIONS",
    WEBSITE: "WEBSITES",
    ANDROID_OR_FLUTTER: "ANDROID_OR_FLUTTER"
  };
  return interests[type] ?? "NOT_SURE";
}

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
    const projectType = String(data.get("projectType") ?? "NOT_SURE") as LeadSubmission["projectType"];
    const company = String(data.get("company") ?? "").trim();
    const timeline = String(data.get("timeline") ?? "") as LeadSubmission["timeline"] | "";
    const fields = {
      fullName: String(data.get("fullName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      projectSummary: String(data.get("projectSummary") ?? "").trim(),
      projectType,
      ...(company ? { company } : {}),
      ...(timeline ? { timeline } : {})
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
          serviceInterests: [interestForType(projectType)],
          source: "WEBSITE_CONTACT",
          submissionToken: request.current.token
        })
      });
      if (!response.ok) {
        if (response.status === 429)
          throw new Error("We have received several enquiries at once. Please try again shortly.");
        throw new Error("Your enquiry could not be sent. Your details are still here. Please try again.");
      }
      setStatus("success");
      request.current = null;
      form.reset();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your enquiry could not be sent. Please try again."
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="x-contact-success" role="status" aria-live="polite">
        <span>ENQUIRY RECEIVED / THANK YOU</span>
        <h2>A good place to begin.</h2>
        <p>
          Thank you for explaining what you have in mind. Your enquiry has been
          received. We will respond to the email address you shared.
        </p>
        <button type="button" onClick={() => setStatus("idle")}>
          Start another enquiry <span aria-hidden="true">↗</span>
        </button>
      </div>
    );
  }

  return (
    <form className="v-form x-contact-form" onSubmit={submit}>
      <div className="x-contact-fields-two">
        <div className="v-field">
          <label htmlFor="contact-name">Your name <span aria-hidden="true">*</span></label>
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
          <label htmlFor="contact-email">Work email <span aria-hidden="true">*</span></label>
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
        <label htmlFor="contact-company">Company or organization <span>(optional)</span></label>
        <input
          autoComplete="organization"
          id="contact-company"
          maxLength={160}
          name="company"
          placeholder="Who are you building this for?"
        />
      </div>
      <fieldset className="x-contact-types">
        <legend>What do you have in mind? <span aria-hidden="true">*</span></legend>
        <p>Choose the closest starting point. It doesn't need to be exact.</p>
        <div className="x-contact-type-grid">
          {projectOptions.map((option) => (
            <label className="x-contact-choice" key={option.value}>
              <input
                type="radio"
                name="projectType"
                value={option.value}
                required
                defaultChecked={option.value === "NOT_SURE"}
              />
              <span>{option.label}</span>
              <span aria-hidden="true" className="x-choice-check">↗</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="v-field">
        <label htmlFor="contact-summary">Tell us what needs to change <span aria-hidden="true">*</span></label>
        <textarea
          id="contact-summary"
          maxLength={5000}
          minLength={20}
          name="projectSummary"
          placeholder="What's happening today? What would you like to work better? Share as much or as little context as you need."
          required
          rows={5}
        />
        <span className="x-contact-field-hint">At least 20 characters. No formal brief required.</span>
      </div>
      <div className="v-field">
        <label htmlFor="contact-timeline">Ideal timing <span>(optional)</span></label>
        <select defaultValue="" id="contact-timeline" name="timeline">
          <option value="">We can discuss this together</option>
          <option value="AS_SOON_AS_POSSIBLE">As soon as practical</option>
          <option value="ONE_TO_THREE_MONTHS">Within the next three months</option>
          <option value="THREE_TO_SIX_MONTHS">Within three to six months</option>
          <option value="SIX_MONTHS_PLUS">Six months or later</option>
          <option value="FLEXIBLE">Flexible</option>
        </select>
      </div>
      <div aria-hidden="true" className="v-honey">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input autoComplete="off" id="contact-website" name="website" tabIndex={-1} />
      </div>
      <label className="v-consent x-contact-consent">
        <input name="consent" required type="checkbox" />
        <span>
          I agree to Valtum Studio using my details to respond to this enquiry.
          Read our{" "}
          <a href="/privacy">privacy information</a>.
        </span>
      </label>
      <button className="v-submit x-contact-submit" disabled={status === "submitting"} type="submit">
        {status === "submitting" ? "Sending your enquiry…" : "Send your enquiry"}
        <span aria-hidden="true">↗</span>
      </button>
      {status === "error" && (
        <p className="v-form-status v-form-error" role="alert">{error}</p>
      )}
    </form>
  );
}
