import { permanentRedirect } from "next/navigation";

export default function LegacyRoute(): never {
  permanentRedirect("/contact");
}
