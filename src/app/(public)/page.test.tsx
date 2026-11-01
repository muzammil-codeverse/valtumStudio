import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  vi.unstubAllEnvs();
});

describe("PublicHomePage UI", () => {
  it("keeps the authored opening semantic and all five projects reachable", () => {
    render(<HomePage {...data} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Good ideas.*Beautifully built/
    );
    for (const slug of [
      "aegis-sentinel",
      "laugh-and-lodge",
      "kt-couriers",
      "math-intellect",
      "personality-assessor"
    ]) {
      expect(document.querySelector(`a[href="/work/${slug}"]`)).toBeInTheDocument();
    }
  });

  it("offers direct commercial routes without requiring the animated archive", () => {
    render(<HomePage {...data} />);
    expect(screen.getByRole("link", { name: /Explore solutions/ })).toHaveAttribute(
      "href",
      "/solutions"
    );
    expect(screen.getByRole("link", { name: /See how we work/ })).toHaveAttribute(
      "href",
      "/approach"
    );
    expect(screen.getByRole("link", { name: /Start a project/ })).toHaveAttribute(
      "href",
      "/contact"
    );
  });

  it("lets visitors browse real project captures and open the selected case study", () => {
    render(<HomePage {...data} />);
    expect(
      screen.getByRole("link", { name: "View Aegis Sentinel case study" })
    ).toHaveAttribute("href", "/work/aegis-sentinel");
    fireEvent.click(screen.getByRole("button", { name: "Next project" }));
    expect(
      screen.getByRole("link", { name: "View Laugh & Lodge case study" })
    ).toHaveAttribute("href", "/work/laugh-and-lodge");
    const gallery = screen.getByRole("region", { name: "Explore our projects" });
    fireEvent.keyDown(gallery, { key: "ArrowLeft" });
    fireEvent.click(screen.getByRole("button", { name: "Previous project" }));
    expect(
      screen.getByRole("link", { name: "View Personality Assessor case study" })
    ).toHaveAttribute("href", "/work/personality-assessor");
  });

  it("does not manufacture client metrics or testimonials", () => {
    render(<HomePage {...data} />);
    expect(
      screen.queryByText(/trusted by|testimonial|clients|rating/i)
    ).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole("img")
        .every((image) =>
          Boolean(image.getAttribute("alt") || image.getAttribute("aria-label"))
        )
    ).toBe(true);
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
    expect(metadata.description).toBe(
      "Software, systems and digital experiences. An independent Australian studio bringing product thinking, design and engineering together."
    );
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
      /Good ideas.*Beautifully built/
    );
    expect(
      screen.queryByRole("heading", { name: "Evidence, not theatre." })
    ).not.toBeInTheDocument();
  });
});
