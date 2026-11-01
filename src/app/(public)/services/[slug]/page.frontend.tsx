export { default, generateMetadata } from "./page";
import { serviceStories } from "@/modules/public-site/studio/services";
export const dynamicParams = false;
export function generateStaticParams(): Array<{ slug: string }> {
  return serviceStories.map(({ slug }) => ({ slug }));
}
