import { redirect } from "next/navigation";

export default function LegacyRoute(): never {
  redirect("/approach");
}
