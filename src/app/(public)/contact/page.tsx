import type { Metadata } from "next";

import { studioContact } from "@/config/studio-presence";
import { ContactForm } from "@/modules/public-site/studio/ContactForm";
import { pageSeo, publicPageMetadata } from "@/modules/public-site/studio/seo";
import { SeoBreadcrumb } from "@/modules/public-site/studio/SeoBreadcrumb";

export const metadata: Metadata = publicPageMetadata(pageSeo.contact, "/contact");

export default function ContactPage(): React.JSX.Element {
  return (
    <main className="v-contact v-contact--editorial" id="main-content">
      <SeoBreadcrumb title="Contact" path="/contact" />
      <div className="vc-grid">
        <div className="vc-intro">
          <span className="vc-side-note">A conversation with Valtum Studio</span>
          <h1 data-reveal>
            Start with
            <br />
            <em>the challenge.</em>
          </h1>
          <p className="vc-lead">
            A product worth creating. A process that should take less work. An
            experience that needs a different point of view. Tell us what is
            happening, and what a better outcome would look like.
          </p>
          <div className="vc-contact-points">
            <a href={`mailto:${studioContact.email}`}>
              <span>Write to us</span>
              <strong>{studioContact.email}</strong>
              <span aria-hidden="true">↗</span>
            </a>
            <a href={studioContact.whatsApp} target="_blank" rel="noopener noreferrer">
              <span>Message us</span>
              <strong>WhatsApp</strong>
              <span aria-hidden="true">↗</span>
            </a>
            <a href={`tel:${studioContact.phone}`}>
              <span>Call the studio</span>
              <strong>{studioContact.phoneDisplay}</strong>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="vc-side-footer">
            <span className="vc-signal" aria-hidden="true" />
            Based in Australia. Working across borders.
          </div>
        </div>
        <div className="vc-form-panel">
          <div className="vc-form-header">
            <span>Project enquiry</span>
            <span>01 / Introduction</span>
          </div>
          <ContactForm />
        </div>
      </div>
      <section className="vc-after" aria-label="What happens after you get in touch">
        <h2>Clarity before commitment.</h2>
        <div>
          <p>
            We read your enquiry, explore the problem with you, and discuss a sensible
            next step. You do not need a finished brief or every technical answer.
          </p>
          <p>
            No automatic project promise, no elaborate sales theatre. Just a direct
            conversation about whether we are the right team for the work.
          </p>
        </div>
      </section>
    </main>
  );
}
