"use client";

import { useRef, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";
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
    const fields = {
      fullName: String(data.get("fullName") ?? ""),
      email: String(data.get("email") ?? ""),
      projectSummary: String(data.get("projectSummary") ?? ""),
      projectType: String(data.get("projectType") ?? "NOT_SURE")
    };
    const signature = JSON.stringify(fields);
    if (request.current?.signature !== signature)
      request.current = { signature, token: crypto.randomUUID().replaceAll("-", "") };
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
          projectStage: "NOT_SURE",
          serviceInterests: ["NOT_SURE"],
          source: "WEBSITE_CONTACT",
          submissionToken: request.current.token
        })
      });
      if (!response.ok) {
        if (response.status === 429)
          throw new Error(
            "A few enquiries have arrived together. Please wait a moment and try again."
          );
        throw new Error(
          "Your enquiry could not be sent. Your words are still here. Please try again."
        );
      }
      setStatus("success");
      request.current = null;
      form.reset();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not send your enquiry. Please try again."
      );
      setStatus("error");
    }
  }
  if (status === "success")
    return (
      <div aria-live="polite" className="v-form-status">
        <h2 style={{ fontSize: 35, margin: "20px 0" }}>A good place to begin.</h2>
        <p>
          Thank you for telling us about your idea. We will read it carefully and get back to you at the email you shared.
        </p>
        <button
          className="v-submit"
          onClick={() => setStatus("idle")}
          style={{ marginTop: 25 }}
        >
          Send another enquiry ↗
        </button>
      </div>
    );
  return (
    <form className="v-form" onSubmit={submit}>
      <div className="v-field">
        <label htmlFor="contact-name">Your name</label>
        <input
          autoComplete="name"
          id="contact-name"
          maxLength={120}
          minLength={2}
          name="fullName"
          placeholder="How should we address you?"
          required
        />
      </div>
      <div className="v-field">
        <label htmlFor="contact-email">Email address</label>
        <input
          autoComplete="email"
          id="contact-email"
          maxLength={254}
          name="email"
          placeholder="Where can we reach you?"
          required
          type="email"
        />
      </div>
      <div className="v-field">
        <label htmlFor="contact-type">What do you have in mind?</label>
        <select defaultValue="NOT_SURE" id="contact-type" name="projectType">
          <option value="NOT_SURE">Let us work it out together</option>
          <option value="WEB_APPLICATION">A product or platform</option>
          <option value="AI_OR_AUTOMATION">An intelligent system</option>
          <option value="WEBSITE">A digital experience</option>
          <option value="ANDROID_OR_FLUTTER">A mobile application</option>
        </select>
      </div>
      <div className="v-field">
        <label htmlFor="contact-summary">Tell us a little about it</label>
        <textarea
          id="contact-summary"
          maxLength={5000}
          minLength={20}
          name="projectSummary"
          placeholder="The idea, the challenge, or the thing you wish worked better. At least 20 characters."
          required
          rows={4}
        />
      </div>
      <div aria-hidden="true" className="v-honey">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input autoComplete="off" id="contact-website" name="website" tabIndex={-1} />
      </div>
      <label className="v-consent">
        <input name="consent" required type="checkbox" />
        <span>
          I agree to Valtum Studio using these details to respond to my enquiry. Read
          our{" "}
          <a href="/privacy" style={{ textDecoration: "underline" }}>
            privacy information
          </a>
          .
        </span>
      </label>
      <button className="v-submit" disabled={status === "submitting"} type="submit">
        {status === "submitting"
          ? "Sending your enquiry"
          : "Begin a conversation"}
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
