import {
  buildBreadcrumbListJsonLd,
  serializeJsonLd
} from "@/modules/public-content/domain/structured-data";

import { SEO_ORIGIN } from "./seo";

/** Non-visual structured data describing the existing public navigation hierarchy. */
export function SeoBreadcrumb({
  title,
  path
}: Readonly<{ title: string; path: string }>): React.JSX.Element {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(
          buildBreadcrumbListJsonLd(SEO_ORIGIN, [
            { name: "Home", path: "/" },
            { name: title, path }
          ])
        )
      }}
    />
  );
}
