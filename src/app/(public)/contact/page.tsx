import type { Metadata } from "next";

import { loadHomePageData } from "@/modules/public-site/home/data/home-loader";
import { ContactForm } from "@/modules/public-site/studio/ContactForm";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Start a conversation | Valtum Studio",
  description:
    "Tell Valtum Studio about your next product, system or digital experience."
};
export const dynamic = "force-dynamic";
export default async function ContactPage(): Promise<React.JSX.Element> {
  const { settings } = await loadHomePageData();
  return (
    <main className="v-contact" id="main-content">
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
        {settings.publicEmail && (
          <a
            className="v-text-link"
            href={`mailto:${settings.publicEmail}`}
            style={{ marginTop: 35 }}
          >
            {settings.publicEmail} ↗
          </a>
        )}
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
