import "server-only";

import { siteConfig } from "@/config/site";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { logger } from "@/lib/logging";
import { getPublicFeaturedProjects } from "@/modules/public-content/server/projects";
import { getPublicServices } from "@/modules/public-content/server/services";
import { getPublicSettings } from "@/modules/public-content/server/settings";
import { getPublicTeamMembers } from "@/modules/public-content/server/team";
import type { PublicSettingsDTO } from "@/modules/public-content/types/dto";

import type { HomePageData } from "./home-data";

const fallbackSettings: PublicSettingsDTO = {
  studioName: siteConfig.name
};

export async function loadHomePageData(): Promise<HomePageData> {
  const [settingsResult, projectsResult, servicesResult, teamResult] =
    await Promise.allSettled([
      getPublicSettings(),
      getPublicFeaturedProjects(3),
      getPublicServices(),
      getPublicTeamMembers()
    ]);

  const results = [
    { domain: "homepage-settings", result: settingsResult },
    { domain: "homepage-projects", result: projectsResult },
    { domain: "homepage-services", result: servicesResult },
    { domain: "homepage-team", result: teamResult }
  ] as const;

  // Unexpected errors invalidate the entire homepage composition
  for (const { result } of results) {
    if (result.status === "rejected" && !isDatabaseUnavailableError(result.reason)) {
      throw result.reason;
    }
  }

  let settings: PublicSettingsDTO = fallbackSettings;
  if (settingsResult.status === "fulfilled") {
    settings = settingsResult.value;
  } else {
    logger.warn(
      "Public settings query failed due to database unavailability; using fallback defaults.",
      {
        classification: "database_unavailable",
        domain: "homepage-settings",
        event: "homepage_query_db_unavailable"
      }
    );
  }

  let projects: HomePageData["projects"] = [];
  if (projectsResult.status === "fulfilled") {
    projects = projectsResult.value;
  } else {
    logger.warn(
      "Public projects query failed due to database unavailability; using fallback defaults.",
      {
        classification: "database_unavailable",
        domain: "homepage-projects",
        event: "homepage_query_db_unavailable"
      }
    );
  }

  let services: HomePageData["services"] = [];
  if (servicesResult.status === "fulfilled") {
    services = servicesResult.value;
  } else {
    logger.warn(
      "Public services query failed due to database unavailability; using fallback defaults.",
      {
        classification: "database_unavailable",
        domain: "homepage-services",
        event: "homepage_query_db_unavailable"
      }
    );
  }

  let team: HomePageData["team"] = [];
  if (teamResult.status === "fulfilled") {
    team = teamResult.value;
  } else {
    logger.warn(
      "Public team query failed due to database unavailability; using fallback defaults.",
      {
        classification: "database_unavailable",
        domain: "homepage-team",
        event: "homepage_query_db_unavailable"
      }
    );
  }

  return {
    projects,
    services,
    settings,
    team
  };
}
