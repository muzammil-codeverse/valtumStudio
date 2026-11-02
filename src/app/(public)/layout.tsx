import "lenis/dist/lenis.css";
import "@/modules/public-site/studio/studio.css";
import "@/modules/public-site/studio/revision.css";
import "@/modules/public-site/studio/experience.css";
import "@/modules/public-site/studio/choreography.css";
import "@/modules/public-site/studio/hero.css";
import "@/modules/public-site/studio/device-polish.css";
import "@/modules/public-site/studio/footer.css";
import "@/modules/public-site/studio/leadership.css";
import "@/modules/public-site/studio/contact-editorial.css";
import "@/modules/public-site/studio/leadership.css";
import "@/modules/public-site/studio/contact-editorial.css";
import "@/modules/public-site/studio/cookie-consent.css";
import "@/modules/public-site/studio/cookie-notice.css";

import type { ReactNode } from "react";

import { StudioShell } from "@/modules/public-site/studio/StudioShell";

export default function PublicLayout({
  children
}: Readonly<{ children: ReactNode }>): ReactNode {
  return <StudioShell>{children}</StudioShell>;
}
