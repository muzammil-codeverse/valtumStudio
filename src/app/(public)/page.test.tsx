import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { logger } from "@/lib/logging";
import type {
  PublicServiceDTO,
  PublicSettingsDTO
} from "@/modules/public-content/types/dto";
import type { HomePageData } from "@/modules/public-site/home/data/home-data";
import { loadHomePageData } from "@/modules/public-site/home/data/home-loader";
import { HomePage } from "@/modules/public-site/home/ui/HomePage";

import PublicHomePage, { dynamic, generateMetadata } from "./page";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/logging", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock("@/modules/public-content/server/settings", () => ({
  getPublicSettings: vi.fn()
}));

vi.mock("@/modules/public-content/server/projects", () => ({
  getPublicFeaturedProjects: vi.fn()
}));

vi.mock("@/modules/public-content/server/services", () => ({
  getPublicServices: vi.fn()
}));

vi.mock("@/modules/public-content/server/team", () => ({
  getPublicTeamMembers: vi.fn()
}));

import { getPublicFeaturedProjects } from "@/modules/public-content/server/projects";
import { getPublicServices } from "@/modules/public-content/server/services";
import { getPublicSettings } from "@/modules/public-content/server/settings";
import { getPublicTeamMembers } from "@/modules/public-content/server/team";

const data: HomePageData = {
  projects: [],
  services: [],
  settings: { studioName: "Valtum Studio" },
  team: []
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PublicHomePage UI", () => {
  it("renders the approved hero heading with one page h1", () => {
    render(<HomePage {...data} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Clarity from complexity." })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("uses only homepage anchors for public navigation", () => {
    render(<HomePage {...data} />);

    const links = screen.getAllByRole("link");
    const navigationLinks = links.filter((link) =>
      ["Work", "Capabilities", "Process", "Studio", "Start a project"].includes(
        link.textContent ?? ""
      )
    );
    expect(navigationLinks.length).toBeGreaterThan(0);
    expect(
      navigationLinks.every((link) => link.getAttribute("href")?.startsWith("#"))
    ).toBe(true);
    expect(
      screen.queryByRole("link", { name: /services|insights|privacy/i })
    ).not.toBeInTheDocument();
  });

  it("omits selected work when there are no publicly supplied project scenes", () => {
    render(<HomePage {...data} />);

    expect(
      screen.queryByRole("heading", { name: "Evidence, not theatre." })
    ).not.toBeInTheDocument();
  });

  it("keeps capability selection accessible", async () => {
    const user = userEvent.setup();
    render(<HomePage {...data} />);
    const capability = screen.getByRole("tab", {
      name: /web applications and backends/i
    });

    await user.click(capability);

    expect(capability).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Reliable applications");
  });

  it("exposes accessible mobile navigation state", async () => {
    const user = userEvent.setup();
    render(<HomePage {...data} />);
    const button = screen.getByRole("button", { name: "Open navigation" });

    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("dialog", { name: "Mobile navigation" })
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the approved lead mechanism and does not render fake social proof", () => {
    render(<HomePage {...data} />);

    expect(
      screen.getByRole("heading", { name: /Have something complex to build/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start a project" })).toBeInTheDocument();
    expect(
      screen.queryByText(/trusted by|testimonial|clients|rating/i)
    ).not.toBeInTheDocument();
  });
});

describe("PublicHomePage Route Configuration & Resilience", () => {
  it("exports dynamic = 'force-dynamic' at route level", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("resolves default metadata when getPublicSettings throws a database availability error", async () => {
    const p1001Error = new Prisma.PrismaClientKnownRequestError(
      "Can't reach database server at 127.0.0.1:5434",
      {
        clientVersion: "5.0.0",
        code: "P1001"
      }
    );
    vi.mocked(getPublicSettings).mockRejectedValueOnce(p1001Error);

    const metadata = await generateMetadata();

    expect(metadata.title).toBe("Valtum Studio");
    expect(metadata.description).toBe("Valtum Studio — custom software, digital products and creative development.");
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Public settings query failed for homepage metadata"),
      {
        classification: "database_unavailable",
        domain: "homepage-metadata",
        event: "homepage_metadata_db_unavailable"
      }
    );
  });

  it("rethrows non-availability errors in generateMetadata", async () => {
    const programmingError = new TypeError("Cannot read properties of undefined");
    vi.mocked(getPublicSettings).mockRejectedValueOnce(programmingError);

    await expect(generateMetadata()).rejects.toThrow(programmingError);
  });

  it("provides safe fallbacks for loadHomePageData when all queries encounter database availability errors", async () => {
    const dbErr = new Prisma.PrismaClientKnownRequestError(
      "Can't reach database server at 127.0.0.1:5434",
      {
        clientVersion: "5.0.0",
        code: "P1001"
      }
    );
    vi.mocked(getPublicSettings).mockRejectedValueOnce(dbErr);
    vi.mocked(getPublicFeaturedProjects).mockRejectedValueOnce(dbErr);
    vi.mocked(getPublicServices).mockRejectedValueOnce(dbErr);
    vi.mocked(getPublicTeamMembers).mockRejectedValueOnce(dbErr);

    const result = await loadHomePageData();

    expect(result.settings).toEqual({ studioName: "Valtum Studio" });
    expect(result.projects).toEqual([]);
    expect(result.services).toEqual([]);
    expect(result.team).toEqual([]);
  });

  it("preserves successful query results in partial database outages", async () => {
    const dbErr = new Prisma.PrismaClientKnownRequestError(
      "Can't reach database server at 127.0.0.1:5434",
      {
        clientVersion: "5.0.0",
        code: "P1001"
      }
    );
    const mockSettings: PublicSettingsDTO = { studioName: "Custom Studio Name" };
    const mockServices: ReadonlyArray<PublicServiceDTO> = [
      {
        capabilities: [],
        canonicalUrl: null,
        description: "Service Description",
        featured: true,
        heroAsset: null,
        id: "srv-1",
        publishedAt: null,
        seoDescription: null,
        seoTitle: null,
        slug: "web-dev",
        socialImageAsset: null,
        sortOrder: 1,
        summary: "Service Summary",
        title: "Web Dev"
      }
    ];

    vi.mocked(getPublicSettings).mockResolvedValueOnce(mockSettings);
    vi.mocked(getPublicFeaturedProjects).mockRejectedValueOnce(dbErr);
    vi.mocked(getPublicServices).mockResolvedValueOnce(mockServices);
    vi.mocked(getPublicTeamMembers).mockRejectedValueOnce(dbErr);

    const result = await loadHomePageData();

    expect(result.settings).toEqual(mockSettings);
    expect(result.services).toEqual(mockServices);
    expect(result.projects).toEqual([]);
    expect(result.team).toEqual([]);
  });

  it("rethrows unexpected failures in loadHomePageData and invalidates composition", async () => {
    const dbErr = new Prisma.PrismaClientKnownRequestError("Database unavailable", {
      clientVersion: "5.0.0",
      code: "P1001"
    });
    const programmingErr = new TypeError("Unexpected programming error");

    vi.mocked(getPublicSettings).mockRejectedValueOnce(dbErr);
    vi.mocked(getPublicFeaturedProjects).mockRejectedValueOnce(programmingErr);
    vi.mocked(getPublicServices).mockResolvedValueOnce([]);
    vi.mocked(getPublicTeamMembers).mockResolvedValueOnce([]);

    await expect(loadHomePageData()).rejects.toThrow(programmingErr);
  });

  it("renders PublicHomePage component using loaded outage data", async () => {
    const dbErr = new Prisma.PrismaClientKnownRequestError(
      "Can't reach database server at 127.0.0.1:5434",
      {
        clientVersion: "5.0.0",
        code: "P1001"
      }
    );
    vi.mocked(getPublicSettings).mockRejectedValueOnce(dbErr);
    vi.mocked(getPublicFeaturedProjects).mockRejectedValueOnce(dbErr);
    vi.mocked(getPublicServices).mockRejectedValueOnce(dbErr);
    vi.mocked(getPublicTeamMembers).mockRejectedValueOnce(dbErr);

    const element = await PublicHomePage();
    render(element);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Clarity from complexity."
    );
    expect(
      screen.queryByRole("heading", { name: "Evidence, not theatre." })
    ).not.toBeInTheDocument();
  });
});
