import type {
  PublicProjectDTO,
  PublicServiceDTO,
  PublicSettingsDTO,
  PublicTeamMemberDTO
} from "@/modules/public-content/types/dto";

export type HomePageData = Readonly<{
  projects: ReadonlyArray<PublicProjectDTO>;
  services: ReadonlyArray<PublicServiceDTO>;
  settings: PublicSettingsDTO;
  team: ReadonlyArray<PublicTeamMemberDTO>;
}>;

export const homeNavigation = [
  { href: "#work", label: "Work" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#process", label: "Process" },
  { href: "#studio", label: "Studio" },
  { href: "#contact", label: "Start a project" }
] as const;

export const defaultCapabilities = [
  {
    title: "Digital products and platforms",
    description: "Useful product journeys, designed around the work people need to do."
  },
  {
    title: "Web applications and backends",
    description: "Reliable applications, integrations and operational foundations."
  },
  {
    title: "AI, automation and intelligent systems",
    description:
      "Applied intelligence that makes a meaningful part of the work clearer."
  },
  {
    title: "Data and computer vision",
    description: "Data products and perception systems built around evidence."
  },
  {
    title: "Android product development",
    description: "Focused mobile products for the contexts where they are most useful."
  },
  {
    title: "Blockchain and Web3 systems",
    description:
      "Technically considered systems where decentralised infrastructure is warranted."
  }
] as const;
