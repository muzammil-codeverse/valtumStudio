import type { Metadata } from "next";
import Link from "next/link";

import { CookieSettingsButton } from "@/modules/public-site/studio/CookieSettingsButton";
import { pageSeo, publicPageMetadata } from "@/modules/public-site/studio/seo";
import { SeoBreadcrumb } from "@/modules/public-site/studio/SeoBreadcrumb";

export const metadata: Metadata = publicPageMetadata(pageSeo.cookies, "/cookies");

export default function CookiesPage(): React.JSX.Element {
  return (
    <main className="v-legal" id="main-content">
      <SeoBreadcrumb title="Cookies" path="/cookies" />
      <h1>
        Cookies, with
        <br />
        <em>clear choices.</em>
      </h1>
      <p>
        Our public site uses essential storage to run correctly, maintain security and
        remember your cookie decision. Optional tools require your choice.
      </p>
      <h2>Essential storage</h2>
      <p>
        A first-party cookie named <code>valtum_cookie_choices</code> records your
        preferences for up to 180 days. It is protected from JavaScript access, sent
        only over HTTPS on the live site, and does not contain an advertising
        identifier. Our private authenticated areas also use security and session
        cookies where required. The public experience may use session storage for the
        opening animation.
      </p>
      <h2>Optional analytics and functionality</h2>
      <p>
        The public site currently does not activate optional analytics, advertising or
        personalization scripts. You can save a preference for future analytics or
        optional functionality. If new tracking technology is introduced, we will review
        its purpose and request renewed consent when necessary before enabling it.
      </p>
      <h2>How choices work</h2>
      <p>
        Rejecting optional cookies does not affect access to the public website. You can
        accept, reject, customize or later withdraw your preferences through the
        settings panel. Your selection is stored by the website rather than attached to
        a project enquiry.
      </p>
      <div className="vc-cookie-policy-action">
        <CookieSettingsButton />
      </div>
      <h2>External services</h2>
      <p>
        Our hosting and media providers receive standard connection information when
        serving the website. If you follow an external social or professional profile
        link, that service has its own privacy practices.
      </p>
      <h2>Questions?</h2>
      <p>
        For enquiries about personal information, get in touch through our{" "}
        <Link href="/contact">contact page</Link> and consult our{" "}
        <Link href="/privacy">privacy information</Link>.
      </p>
      <p>Last updated: 2 November 2026.</p>
    </main>
  );
}
