import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { loadHomePageData } from "@/modules/public-site/home/data/home-loader";
import { ContactForm } from "@/modules/public-site/studio/ContactForm";
import { pageSeo, publicPageMetadata } from "@/modules/public-site/studio/seo";
import { SeoBreadcrumb } from "@/modules/public-site/studio/SeoBreadcrumb";

export const metadata: Metadata = publicPageMetadata(pageSeo.contact, "/contact");
export const dynamic = "force-dynamic";
export default async function ContactPage(): Promise<React.JSX.Element> {
  const { settings } = await loadHomePageData();
  const publicEmail = settings.publicEmail?.trim() || siteConfig.publicEmail;
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
          href={`mailto:${publicEmail}`}
          style={{ marginTop: 35 }}
        >
          {publicEmail} ↗
        </a>
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
