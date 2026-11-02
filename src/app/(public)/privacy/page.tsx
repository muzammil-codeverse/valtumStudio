import type { Metadata } from "next";
import Link from "next/link";

import { pageSeo, publicPageMetadata } from "@/modules/public-site/studio/seo";

export const metadata: Metadata = publicPageMetadata(pageSeo.privacy, "/privacy");
export default function PrivacyPage(): React.JSX.Element {
  return (
    <main className="v-legal" id="main-content">
      <h1 style={{ marginTop: 35 }}>
        Your enquiry.
        <br />
        <em>Your information.</em>
      </h1>
      <p>
        This page explains how the project enquiry on this website uses the information
        you choose to share.
      </p>
      <h2>What you share</h2>
      <p>
        The enquiry form asks for your name, email address, project interest and a
        description of your idea. Please avoid sending passwords, payment details or
        sensitive personal information.
      </p>
      <h2>Why we collect it</h2>
      <p>
        We use these details to understand your enquiry, respond to you and keep a
        record of the conversation. The form also records consent, the page from which
        it was sent and information used to protect the service against spam and
        duplicate submissions.
      </p>
      <h2>Cookies and essential storage</h2>
      <p>
        The public experience uses session storage to remember whether you have seen the
        short opening animation. Authentication areas use the storage and cookies needed
        to manage a secure session.
      </p>
      <h2>Questions or requests</h2>
      <p>
        If you would like to ask about the information you have shared, or request a
        correction or deletion, contact the studio through the{" "}
        <Link href="/contact" style={{ textDecoration: "underline" }}>
          enquiry page
        </Link>
        . Identify the email address used in your original enquiry so we can locate the
        relevant record.
      </p>
    </main>
  );
}
