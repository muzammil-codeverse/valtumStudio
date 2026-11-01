export { default, generateMetadata } from "./page";

import { stories } from "@/modules/public-site/studio/content";

export const dynamicParams = false;
export function generateStaticParams(): Array<{ slug: string }> {
  return stories.map(({ slug }) => ({ slug }));
}
