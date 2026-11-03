import { permanentRedirect } from "next/navigation";

export default function CookiePage(): never {
  permanentRedirect("/cookies");
}
