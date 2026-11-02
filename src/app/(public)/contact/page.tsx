import type { Metadata } from "next";

import { studioContact } from "@/config/studio-presence";
import { ContactForm } from "@/modules/public-site/studio/ContactForm";
import { pageSeo, publicPageMetadata } from "@/modules/public-site/studio/seo";
import { SeoBreadcrumb } from "@/modules/public-site/studio/SeoBreadcrumb";

export const metadata: Metadata = publicPageMetadata(pageSeo.contact, "/contact");

export default function ContactPage(): React.JSX.Element {
  return (
    <main className="v-contact x-contact-page" id="main-content">
      <SeoBreadcrumb title="Contact" path="/contact" />
      <section className="x-contact-main" aria-labelledby="contact-heading">
        <div className="x-contact-intro">
          <div className="x-contact-intro-inner" data-reveal>
            <div className="x-contact-topline">
              <span>LET'S BEGIN SOMEWHERE REAL</span>
              <span>VALTUM STUDIO / AUSTRALIA</span>
            </div>
            <h1 id="contact-heading">
              What needs
              <br />
              <em>to work better?</em>
            </h1>
            <p className="x-contact-lead">
              A new product, an awkward process, or a digital experience
              that should be doing more. Tell us about the challenge.
              We can work out the right technology together.
            </p>
          </div>
          <div className="x-contact-direct" data-reveal>
            <span className="x-contact-direct-label">PREFER TO REACH OUT DIRECTLY?</span>
            <a className="x-contact-mail" href={`mailto:${studioContact.email}`}>
              {studioContact.email}<span aria-hidden="true">↗</span>
            </a>
            <div className="x-contact-methods">
              <a href={`tel:${studioContact.phone}`}>
                Call {studioContact.phoneDisplay} <span aria-hidden="true">↗</span>
              </a>
              <a href={studioContact.whatsApp} target="_blank" rel="noopener noreferrer">
                Talk on WhatsApp <span aria-hidden="true">↗</span>
              </a>
            </div>
            <p>Australian registered. Working with teams wherever they are.</p>
          </div>
        </div>
        <div className="x-contact-form-wrap" data-reveal>
          <div className="x-contact-form-heading">
            <span>YOUR ENQUIRY / 01</span>
            <h2>Start with the essentials.</h2>
            <p>No polished brief needed. A few clear details are enough to begin.</p>
          </div>
          <ContactForm />
        </div>
      </section>
      <section className="x-contact-process" aria-labelledby="contact-process-title">
        <div>
          <span className="x-contact-process-kicker">WHAT HAPPENS NEXT</span>
          <h2 id="contact-process-title">
            A good first conversation
            <br />
            <em>is already progress.</em>
          </h2>
        </div>
        <ol>
          <li><span>01</span><p>We read what you send and consider the problem you are trying to solve.</p></li>
          <li><span>02</span><p>We discuss the context, constraints and what a useful outcome would look like.</p></li>
          <li><span>03</span><p>If there is a fit, we define a sensible next step before any work begins.</p></li>
        </ol>
      </section>
    </main>
  );
}
