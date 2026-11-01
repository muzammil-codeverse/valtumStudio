import "lenis/dist/lenis.css";
import "@/modules/public-site/studio/studio.css";
import "@/modules/public-site/studio/revision.css";
import "@/modules/public-site/studio/experience.css";
import "@/modules/public-site/studio/choreography.css";
import "@/modules/public-site/studio/hero.css";
import "@/modules/public-site/studio/device-polish.css";

import type { ReactNode } from "react";

import { StudioShell } from "@/modules/public-site/studio/StudioShell";

export default function PublicLayout({
  children
}: Readonly<{ children: ReactNode }>): ReactNode {
  return <StudioShell>{children}</StudioShell>;
}
