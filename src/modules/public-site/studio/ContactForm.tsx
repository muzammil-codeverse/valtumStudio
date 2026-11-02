"use client";

import { useRef, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const projectTypes = [
  { value: "WEB_APPLICATION", label: "A new digital product", detail: "SaaS, platform or web app", interest: "WEB_APPLICATIONS" },
  { value: "INTERNAL_BUSINESS_SYSTEM", label: "An internal system", detail: "Operations and workflows", interest: "BACKEND_OR_API_ENGINEERING" },
  { value: "MARKETPLACE_OR_BOOKING_PLATFORM", label: "A booking or marketplace platform", detail: "Inventory and transactions", interest: "WEB_APPLICATIONS" },
  { value: "AI_OR_AUTOMATION", label: "AI or automation", detail: "Intelligent and connected tools", interest: "AI_AND_AUTOMATION" },
  { value: "WEBSITE", label: "A digital experience", detail: "Websites with a point of view", interest: "WEBSITES" },
  { value: "ANDROID_OR_FLUTTER", label: "A mobile application", detail: "Native and cross-platform", interest: "ANDROID_OR_FLUTTER" },
  { value: "EXISTING_PRODUCT_IMPROVEMENT", label: "Improve what exists", detail: "Redesign, rebuild or scale", interest: "TECHNICAL_CONSULTING" },
  { value: "NOT_SURE", label: "Let's work it out", detail: "Still exploring the possibilities", interest: "NOT_SURE" }
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
    const selected = projectTypes.find((type) => type.value === projectType);
    const fields = {
      fullName: String(data.get("fullName") ?? ""),
      email: String(data.get("email") ?? ""),
      company: String(data.get("company") ?? ""),
      projectSummary: String(data.get("projectSummary") ?? ""),
      projectType,
      projectStage: String(data.get("projectStage") ?? "NOT_SURE"),
      timeline: String(data.get("timeline") ?? "NOT_SURE")
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
          consentVersion: "valtum-contact-v2",
          honeypot: String(data.get("website") ?? ""),
          landingPageUrl: window.location.href,
          serviceInterests: [selected?.interest ?? "NOT_SURE"],
          source: "WEBSITE_CONTACT",
          submissionToken: request.current.token
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Too many requests have arrived together. Please try again shortly.");
        }
        throw new Error("Your enquiry could not be sent. Your words are still here. Please try again.");
      }

      setStatus("success");
      request.current = null;
      form.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not send your enquiry. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div aria-live="polite" className="v-form-status v-contact-confirmation">
        <span aria-hidden="true">✓</span>
        <h2>A good place to begin.</h2>
        <p>Thank you for telling us about your idea. We will read it carefully and respond at the email you shared.</p>
        <button className="v-submit" onClick={() => setStatus("idle")} type="button">
          Send another enquiry <span aria-hidden="true">↗</span>
        </button>
      </div>
    );
  }

  return (
    <form className="v-form v-form--editorial" onSubmit={submit}>
      <div className="v-form-two">
        <div className="v-field">
          <label htmlFor="contact-name">Your name *</label>
          <input autoComplete="name" id="contact-name" maxLength={120} minLength={2}
            name="fullName" placeholder="What should we call you?" required />
        </div>
        <div className="v-field">
          <label htmlFor="contact-email">Email address *</label>
          <input autoComplete="email" id="contact-email" maxLength={254}
            name="email" placeholder="you@company.com" required type="email" />
        </div>
      </div>
      <div className="v-field">
        <label htmlFor="contact-company">Company <span>(optional)</span></label>
        <input autoComplete="organization" id="contact-company" maxLength={160}
          name="company" placeholder="Business or organisation" />
      </div>

      <fieldset className="v-type-choices">
        <legend>What do you have in mind? *</legend>
        <p>Choose the closest starting point. The details can come later.</p>
        <div className="v-type-grid">
          {projectTypes.map((type) => (
            <label className="v-type-choice" key={type.value}>
              <input type="radio" name="projectType" value={type.value}
                defaultChecked={type.value === "NOT_SURE"} required />
              <span className="v-type-choice-inner">
                <span className="v-type-choice-marker" aria-hidden="true" />
                <strong>{type.label}</strong>
                <small>{type.detail}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="v-field">
        <label htmlFor="contact-summary">Tell us what needs to happen *</label>
        <textarea id="contact-summary" maxLength={5000} minLength={20}
          name="projectSummary" rows={5} required
          placeholder="What is the problem, the opportunity or the idea? Who will use the result, and what needs to change? (At least 20 characters.)" />
      </div>
      <div className="v-form-two">
        <div className="v-field">
          <label htmlFor="contact-stage">Where are you now?</label>
          <select defaultValue="NOT_SURE" id="contact-stage" name="projectStage">
            <option value="NOT_SURE">Still figuring it out</option>
            <option value="IDEA">An idea or early concept</option>
            <option value="DISCOVERY">Research and planning</option>
            <option value="DESIGN">Design stage</option>
            <option value="IN_DEVELOPMENT">Already in development</option>
            <option value="EXISTING_PRODUCT">Improving an existing product</option>
            <option value="LAUNCH_OR_GROWTH">Ready to launch or grow</option>
          </select>
        </div>
        <div className="v-field">
          <label htmlFor="contact-timeline">Ideal timing</label>
          <select defaultValue="NOT_SURE" id="contact-timeline" name="timeline">
            <option value="NOT_SURE">Not decided yet</option>
            <option value="AS_SOON_AS_POSSIBLE">As soon as practical</option>
            <option value="ONE_TO_THREE_MONTHS">Within one to three months</option>
            <option value="THREE_TO_SIX_MONTHS">Within three to six months</option>
            <option value="SIX_MONTHS_PLUS">Beyond six months</option>
            <option value="FLEXIBLE">Flexible</option>
          </select>
        </div>
      </div>
      <div aria-hidden="true" className="v-honey">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input autoComplete="off" id="contact-website" name="website" tabIndex={-1} />
      </div>
      <label className="v-consent">
        <input name="consent" required type="checkbox" />
        <span>
          I agree to Valtum Studio using my details to respond to this enquiry.
          See our <a href="/privacy">privacy information</a>.
          This is separate from optional cookie preferences.
        </span>
      </label>
      <button className="v-submit" disabled={status === "submitting"} type="submit">
        {status === "submitting" ? "Sending your enquiry…" : "Send your enquiry"}
        <span aria-hidden="true">↗</span>
      </button>
      {status === "error" && (
        <p className="v-form-status v-form-error" role="alert">{error}</p>
      )}
    </form>
  );
}
