import type { Metadata } from "next";

import { studioContact } from "@/config/studio-presence";
import { ContactForm } from "@/modules/public-site/studio/ContactForm";
import { pageSeo, publicPageMetadata } from "@/modules/public-site/studio/seo";
import { SeoBreadcrumb } from "@/modules/public-site/studio/SeoBreadcrumb";

export const metadata: Metadata = publicPageMetadata(pageSeo.contact, "/contact");
export const dynamic = "force-dynamic";
export default async function ContactPage(): Promise<React.JSX.Element> {
  return (
    <main className="v-contact" id="main-content">
      <SeoBreadcrumb title="Contact" path="/contact" />
      <div className="v-contact-intro">
        <h1>
          Let’s make
          <br />
          <em>a start.</em>
        </h1>
        <p>
          An idea, a difficult process or a business ready for something better. Tell us
          where you are and what you want to change.
        </p>
        <a
          className="v-text-link"
          href={`mailto:${studioContact.email}`}
          style={{ marginTop: 35 }}
        >
          {studioContact.email} ↗
        </a>
        <div className="v-contact-reach">
          <a href={`tel:${studioContact.phone}`}>Call {studioContact.phoneDisplay}</a>
          <a href={studioContact.whatsApp} target="_blank" rel="noopener noreferrer">
            Message on WhatsApp ↗
          </a>
        </div>
        <p className="v-contact-tip">
          An Australian studio for ideas with a wider horizon.
        </p>
      </div>
      <div className="v-contact-form">
        <ContactForm />
      </div>
    </main>
  );
}
