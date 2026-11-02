import Image from "next/image";
import Link from "next/link";

import { CookieSettingsButton } from "./CookieSettingsButton";

import {
  studioContact,
  studioFounderProfile,
  studioMarketplaces,
  studioSocialProfiles
} from "@/config/studio-presence";

type PresenceProfile = Readonly<{
  label: string;
  url: string;
  icon: string;
}>;

function ProfileLink({ profile }: { profile: PresenceProfile }): React.JSX.Element {
  return (
    <a
      href={profile.url}
      target="_blank"
      rel="noopener noreferrer"
      className="vf-profile-link"
    >
      <span className="vf-profile-icon" aria-hidden="true">
        <Image
          src={`/icons/presence/${profile.icon}.svg`}
          width={18}
          height={18}
          alt=""
          unoptimized
        />
      </span>
      <span>{profile.label}</span>
      <span className="vf-profile-arrow" aria-hidden="true">
        ↗
      </span>
    </a>
  );
}

export function StudioFooter(): React.JSX.Element {
  return (
    <footer className="v-footer v-footer--presence">
      <div className="v-footer-invite" data-reveal>
        <Link href="/contact">
          What are you
          <br />
          <em>imagining?</em>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className="vf-direct">
        <div className="vf-direct-intro">
          <h2>One conversation can change the direction.</h2>
          <p>
            An operational challenge, a product worth building or an experience that
            needs to feel different. Start wherever your thinking is.
          </p>
          <Link href="/contact" className="vf-project-link">
            Tell us about your project <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="vf-direct-channels">
          <a className="vf-email" href={`mailto:${studioContact.email}`}>
            <span className="vf-channel-label">Email the studio</span>
            <span className="vf-email-address">{studioContact.email}</span>
            <span className="vf-channel-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <div className="vf-direct-secondary">
            <a href={`tel:${studioContact.phone}`} className="vf-contact-method">
              <span className="vf-channel-label">Call us</span>
              <span>{studioContact.phoneDisplay}</span>
              <span className="vf-channel-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
            <a
              href={studioContact.whatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="vf-contact-method vf-contact-method--whatsapp"
            >
              <Image
                src="/icons/presence/whatsapp.svg"
                width={19}
                height={19}
                alt=""
                unoptimized
              />
              <span>WhatsApp</span>
              <span className="vf-channel-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
        </div>
      </div>

      <div className="vf-network">
        <div className="vf-network-intro">
          <h2>Elsewhere, in good company.</h2>
          <p>Follow the studio, explore our work or connect with the founder.</p>
        </div>
        <div className="vf-network-directory">
          <section className="vf-network-group" aria-labelledby="vf-social-title">
            <h3 id="vf-social-title">Follow the studio</h3>
            <nav aria-label="Valtum Studio social profiles">
              {studioSocialProfiles.map((profile) => (
                <ProfileLink key={profile.url} profile={profile} />
              ))}
              <ProfileLink profile={studioFounderProfile} />
            </nav>
          </section>
          <section className="vf-network-group" aria-labelledby="vf-work-title">
            <h3 id="vf-work-title">Find our work</h3>
            <nav aria-label="Valtum Studio marketplace and directory profiles">
              {studioMarketplaces.map((profile) => (
                <ProfileLink key={profile.url} profile={profile} />
              ))}
            </nav>
          </section>
          <div className="vf-registered">
            <span className="vf-registered-symbol" aria-hidden="true">
              VS
            </span>
            <p>An Australian-registered studio working across borders.</p>
            <a
              href="https://abr.business.gov.au/ABN/View?id=24207947663"
              target="_blank"
              rel="noopener noreferrer"
            >
              Australian Business Register <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>

      <div className="v-footer-meta vf-footer-bottom">
        <p>© {new Date().getFullYear()} Valtum Studio</p>
        <nav aria-label="Footer navigation">
          <Link href="/work">Work</Link>
          <Link href="/services">Services</Link>
          <Link href="/studio">Studio</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/cookies">Cookies</Link>
          <CookieSettingsButton />
        </nav>
        <span>Good ideas. Beautifully built.</span>
      </div>
      <div className="v-footer-word" aria-label="Valtum Studio">
        <span className="v-footer-name">VALTUM</span>
        <span className="v-footer-studio">STUDIO</span>
      </div>
    </footer>
  );
}
