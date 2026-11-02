import type { Metadata } from "next";
import Image from "next/image";

import {
  studioContact,
  studioFounderProfile,
  studioSocialProfiles
} from "@/config/studio-presence";
import { ContactForm } from "@/modules/public-site/studio/ContactForm";
import { pageSeo, publicPageMetadata } from "@/modules/public-site/studio/seo";
import { SeoBreadcrumb } from "@/modules/public-site/studio/SeoBreadcrumb";

export const metadata: Metadata = publicPageMetadata(pageSeo.contact, "/contact");

export default function ContactPage(): React.JSX.Element {
  const profiles = [
    studioFounderProfile,
    studioSocialProfiles[0],
    studioSocialProfiles[2]
  ] as const;

  return (
    <main className="vx-contact" id="main-content">
      <SeoBreadcrumb title="Contact" path="/contact" />
      <svg
        className="vx-contact-orbit"
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 1440 980"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d="M5 845 C240 1090 460 628 714 442 S1280 120 1340 310 C1426 585 1135 730 920 935" />
        <circle cx="1340" cy="310" r="3.5" />
        <circle cx="48" cy="894" r="3.5" />
      </svg>
      <div className="vx-contact-layout">
        <header className="vx-contact-intro" data-reveal>
          <h1>
            Tell us about
            <br />
            <span>your challenge.</span>
          </h1>
          <p className="vx-contact-lede">
            Tell us what you&apos;re working on, what needs to change, or what you want
            to build. An early idea is enough to begin a useful conversation.
          </p>

          <nav className="vx-contact-links" aria-label="Contact Valtum Studio">
            <a href={`mailto:${studioContact.email}`}>
              <span className="vx-method-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.65"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </span>
              <span>{studioContact.email}</span>
              <span className="vx-contact-link-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
            <a href={`tel:${studioContact.phone}`}>
              <span className="vx-method-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M6.7 3.7h3l1.25 4.15-2 1.85c1.05 2.1 2.85 3.9 4.95 4.95l1.85-2L20 13.9v3c0 1.9-1.4 3.4-3.3 3.1C9.2 18.8 5.2 14.8 4 7.3 3.7 5.4 5.6 4.1c.3-.2.7-.4 1.1-.4Z" />
                </svg>
              </span>
              <span>{studioContact.phoneDisplay}</span>
              <span className="vx-contact-link-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
            <a href={studioContact.whatsApp} target="_blank" rel="noopener noreferrer">
              <span className="vx-method-icon" aria-hidden="true">
                <Image
                  src="/icons/presence/whatsapp.svg"
                  width={22}
                  height={22}
                  alt=""
                  unoptimized
                />
              </span>
              <span>WhatsApp</span>
              <span className="vx-contact-link-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </nav>
          <nav className="vx-contact-social" aria-label="Studio and founder profiles">
            {profiles.map((profile) => (
              <a
                href={profile.url}
                key={profile.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={profile.label}
              >
                {profile.icon === "linkedin" ? (
                  <span className="vx-linkedin-glyph" aria-hidden="true">
                    in
                  </span>
                ) : (
                  <Image
                    src={`/icons/presence/${profile.icon}.svg`}
                    width={18}
                    height={18}
                    alt=""
                    unoptimized
                  />
                )}
              </a>
            ))}
          </nav>
        </header>
        <div className="vx-contact-form-panel" data-reveal>
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
