import type { Metadata } from "next";
import Link from "next/link";

import { studioContact } from "@/config/studio-presence";
import { ContactForm } from "@/modules/public-site/studio/ContactForm";
import { pageSeo, publicPageMetadata } from "@/modules/public-site/studio/seo";
import { SeoBreadcrumb } from "@/modules/public-site/studio/SeoBreadcrumb";

export const metadata: Metadata = publicPageMetadata(pageSeo.contact, "/contact");

export default function ContactPage(): React.JSX.Element {
  return (
    <main className="v-contact v-contact--editorial" id="main-content">
      <SeoBreadcrumb title="Contact" path="/contact" />
      <div className="v-contact-intro">
        <p className="v-contact-index">A CONVERSATION IS A GOOD PLACE TO START / VALTUM STUDIO</p>
        <h1 data-word-reveal>
          What needs
          <br />
          <em>to work better?</em>
        </h1>
        <p className="v-contact-lead">
          A product to create. A process to untangle. An experience that could
          be better. Tell us what is happening, what needs to change and where
          you want to go.
        </p>
        <div className="v-contact-promise">
          <span aria-hidden="true">01 /</span>
          <p>You bring the challenge. We start by understanding it, not selling a technology.</p>
        </div>
        <div className="v-contact-promise">
          <span aria-hidden="true">02 /</span>
          <p>No fully formed brief required. A clear account of the problem is enough to begin.</p>
        </div>
        <div className="v-contact-direct">
          <p>Prefer a direct introduction?</p>
          <a href={`mailto:${studioContact.email}`}>{studioContact.email} ↗</a>
          <div>
            <a href={`tel:${studioContact.phone}`}>{studioContact.phoneDisplay}</a>
            <a href={studioContact.whatsApp} target="_blank" rel="noopener noreferrer">
              WhatsApp ↗
            </a>
          </div>
          <span>Australian registered. Working internationally.</span>
        </div>
      </div>

      <div className="v-contact-form">
        <div className="v-contact-form-heading">
          <span>PROJECT ENQUIRY / 01</span>
          <h2>Start with the essentials.</h2>
          <p>Just enough to begin a useful conversation. Fields marked * are required.</p>
        </div>
        <ContactForm />
      </div>
      <section className="v-contact-after" aria-label="How we approach new enquiries">
        <span>FROM FIRST CONVERSATION TO A CLEAR NEXT STEP</span>
        <h2>
          Good work starts
          <br />
          <em>with the right questions.</em>
        </h2>
        <p>
          We consider the business context, the people using the software and
          the constraints around delivery. From there, we can decide together
          whether the idea needs a new product, an improved system or another
          approach entirely.
        </p>
        <Link href="/approach">Explore our approach <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
