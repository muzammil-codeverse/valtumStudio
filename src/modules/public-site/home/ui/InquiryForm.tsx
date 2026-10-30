"use client";

import { useState } from "react";

import styles from "./home.module.css";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function InquiryForm(): React.JSX.Element {
  const [status, setStatus] = useState<FormStatus>("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus("submitting");
    const token = crypto.randomUUID().replaceAll("-", "");
    const payload = {
      consent: formData.get("consent") === "on",
      consentVersion: "homepage-v1",
      email: String(formData.get("email") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      honeypot: "",
      landingPageUrl: window.location.href,
      projectStage: "NOT_SURE",
      projectSummary: String(formData.get("projectSummary") ?? ""),
      projectType: "NOT_SURE",
      serviceInterests: ["NOT_SURE"],
      source: "WEBSITE_CONTACT",
      submissionToken: token
    };
    try {
      const response = await fetch("/api/leads", {
        body: JSON.stringify(payload),
        headers: { "content-type": "application/json" },
        method: "POST"
      });
      if (!response.ok) throw new Error("Lead submission failed");
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className={styles.inquiryForm} noValidate onSubmit={submit}>
      <div className={styles.field}>
        <label htmlFor="inquiry-name">Name</label>
        <input
          autoComplete="name"
          id="inquiry-name"
          name="fullName"
          required
          type="text"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="inquiry-email">Email</label>
        <input
          autoComplete="email"
          id="inquiry-email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="inquiry-summary">What are you building?</label>
        <textarea id="inquiry-summary" minLength={20} name="projectSummary" required />
      </div>
      <label className={styles.consent}>
        <input name="consent" required type="checkbox" />
        <span>
          I consent to Valtum Studio using these details to respond to this enquiry.
        </span>
      </label>
      <button
        className={styles.buttonPrimary}
        disabled={status === "submitting"}
        type="submit"
      >
        {status === "submitting" ? "Sending enquiry" : "Start a project"}
      </button>
      {status === "success" ? (
        <p className={styles.formStatus} role="status">
          Thank you. Your enquiry has been received.
        </p>
      ) : null}
      {status === "error" ? (
        <p className={`${styles.formStatus} ${styles.formError}`} role="alert">
          We could not send your enquiry. Please try again.
        </p>
      ) : null}
    </form>
  );
}
