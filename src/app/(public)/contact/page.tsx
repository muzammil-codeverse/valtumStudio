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
      <section className="vc-after vc-after--steps" aria-labelledby="contact-next-title">
        <div className="vc-after-intro">
          <h2 id="contact-next-title">
            A clear first step.
            <br />
            <em>No theatre.</em>
          </h2>
          <p>
            You do not need a finished specification. A clear picture of the
            challenge is a useful place to begin.
          </p>
        </div>
        <ol className="vc-next-steps">
          <li>
            <span aria-hidden="true">01</span>
            <div>
              <h3>We understand the context.</h3>
              <p>What needs changing, who it affects and what a better result means.</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">02</span>
            <div>
              <h3>We talk through the options.</h3>
              <p>Scope, technical constraints, priorities and whether we are the right fit.</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">03</span>
            <div>
              <h3>We agree on a next move.</h3>
              <p>A sensible first piece of work, if there is a reason to move forward.</p>
            </div>
          </li>
        </ol>
      </section>
    </main>
  );
}
