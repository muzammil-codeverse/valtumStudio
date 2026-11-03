import { permanentRedirect } from "next/navigation";

export default function JournalPage(): never {
  permanentRedirect("/blog");
}
