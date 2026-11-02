import type { Metadata } from "next";
import Link from "next/link";

import { CookieSettingsButton } from "@/modules/public-site/studio/CookieSettingsButton";
import { pageSeo, publicPageMetadata } from "@/modules/public-site/studio/seo";
import { SeoBreadcrumb } from "@/modules/public-site/studio/SeoBreadcrumb";

export const metadata: Metadata = publicPageMetadata(pageSeo.cookies, "/cookies");

export default function CookiesPage(): React.JSX.Element {
  return (
    <main className="v-legal x-cookie-page" id="main-content">
      <SeoBreadcrumb title="Cookies" path="/cookies" />
      <div className="x-cookie-notice-intro">
        <span>YOUR PRIVACY / VALTUM STUDIO</span>
        <h1>Cookies, without<br /><em>the guesswork.</em></h1>
        <p>
          We want you to know what your browser stores when you visit this site,
          why it is used, and how to change your preferences.
        </p>
      </div>
      <h2>Essential storage</h2>
      <p>
        Our public site can use session storage for the opening experience.
        We use a first-party local storage preference named
        <code> valtum-cookie-preferences-v1 </code> to remember whether you
        allowed or rejected optional analytics. This selection expires after
        180 days, or earlier if you clear site data. Authentication areas
        may use cookies required for sign-in and account security.
      </p>
      <h2>Optional analytics</h2>
      <p>
        Analytics is optional and disabled by default. If we configure a Google
        Analytics measurement ID, its script is loaded only when you have actively
        allowed analytics. Declining analytics does not restrict use of our public
        site. You can withdraw permission whenever you choose.
      </p>
      <h2>Advertising and third-party embeds</h2>
      <p>
        We do not currently set advertising cookies as part of the public website.
        Links to external social and professional profiles open on their own
        services, which operate under their own privacy practices.
      </p>
      <h2>Change your choice</h2>
      <p>
        Open the preference panel below or use the Cookie preferences option in
        the footer. This preference is kept locally in your browser rather than
        added to your project enquiry.
      </p>
      <div className="x-cookie-notice-action"><CookieSettingsButton /></div>
      <h2>Contact and further information</h2>
      <p>
        Questions about privacy, your enquiry or these preferences can be sent
        through our <Link href="/contact">contact page</Link>.
        Read our <Link href="/privacy">privacy information</Link> for more
        details about enquiry submissions.
      </p>
      <p className="x-cookie-date">Last updated: 2 November 2026.</p>
    </main>
  );
}
