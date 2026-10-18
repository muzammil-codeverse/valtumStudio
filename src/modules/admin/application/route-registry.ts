import type { Action, Resource } from "@/modules/auth/policies/authorization";

export type AdminRoute = {
  path: string;
  label: string;
  description: string;
  breadcrumbLabel: string;
  group: "Overview" | "Content" | "Operations" | "Administration" | "Account";
  iconKey: string;
  requiredResource: Resource;
  requiredAction: Action;
};

export const ADMIN_ROUTES = {
  dashboard: {
    path: "/admin",
    label: "Dashboard",
    description: "Overview of your workspace, content summaries, and account security.",
    breadcrumbLabel: "Dashboard",
    group: "Overview",
    iconKey: "dashboard",
    requiredResource: "dashboard",
    requiredAction: "read"
  },
  services: {
    path: "/admin/services",
    label: "Services",
    description:
      "Manage the service offerings presented across the Siglum Studio website, including titles, summaries, and publication statuses.",
    breadcrumbLabel: "Services",
    group: "Content",
    iconKey: "services",
    requiredResource: "services",
    requiredAction: "read"
  },
  projects: {
    path: "/admin/projects",
    label: "Projects",
    description:
      "Manage the studio portfolio projects, client case studies, and publishing states.",
    breadcrumbLabel: "Projects",
    group: "Content",
    iconKey: "projects",
    requiredResource: "projects",
    requiredAction: "read"
  },
  insights: {
    path: "/admin/insights",
    label: "Insights",
    description:
      "Manage editorial articles, publications, categories, and author metadata.",
    breadcrumbLabel: "Insights",
    group: "Content",
    iconKey: "insights",
    requiredResource: "insights",
    requiredAction: "read"
  },
  faqs: {
    path: "/admin/faqs",
    label: "FAQs",
    description:
      "Manage frequently asked question items, categorisation groups, and order rankings.",
    breadcrumbLabel: "FAQs",
    group: "Content",
    iconKey: "faqs",
    requiredResource: "faqs",
    requiredAction: "read"
  },
  navigation: {
    path: "/admin/navigation",
    label: "Navigation",
    description: "Manage primary menus, footer configurations, and system redirects.",
    breadcrumbLabel: "Navigation",
    group: "Content",
    iconKey: "navigation",
    requiredResource: "navigation",
    requiredAction: "read"
  },
  media: {
    path: "/admin/media",
    label: "Media",
    description:
      "Review and manage uploaded media files, details, dimensions, and usage.",
    breadcrumbLabel: "Media",
    group: "Content",
    iconKey: "media",
    requiredResource: "media",
    requiredAction: "read"
  },
  team: {
    path: "/admin/team",
    label: "Team",
    description: "Manage studio staff profile cards, roles, ordering, and biographies.",
    breadcrumbLabel: "Team",
    group: "Content",
    iconKey: "team",
    requiredResource: "team",
    requiredAction: "read"
  },
  leads: {
    path: "/admin/leads",
    label: "Leads",
    description: "Review client inquiry leads submitted via contact forms.",
    breadcrumbLabel: "Leads",
    group: "Operations",
    iconKey: "leads",
    requiredResource: "leads",
    requiredAction: "read"
  },
  settings: {
    path: "/admin/settings",
    label: "Settings",
    description: "Configure studio global properties and branding details.",
    breadcrumbLabel: "Settings",
    group: "Administration",
    iconKey: "settings",
    requiredResource: "siteSettings",
    requiredAction: "read"
  },
  users: {
    path: "/admin/users",
    label: "Users",
    description:
      "Manage operator dashboard accounts, permission roles, and status fields.",
    breadcrumbLabel: "Users",
    group: "Administration",
    iconKey: "users",
    requiredResource: "users",
    requiredAction: "read"
  },
  security: {
    path: "/admin/security",
    label: "Security",
    description: "Monitor security operations and entry points.",
    breadcrumbLabel: "Security",
    group: "Administration",
    iconKey: "security",
    requiredResource: "securityEvents",
    requiredAction: "read"
  },
  sessions: {
    path: "/admin/security/sessions",
    label: "Sessions",
    description: "Manage active web sessions, device associations, and revoke tokens.",
    breadcrumbLabel: "Active Sessions",
    group: "Account",
    iconKey: "sessions",
    requiredResource: "sessions",
    requiredAction: "read"
  }
} as const satisfies Record<string, AdminRoute>;

export type AdminRouteKey = keyof typeof ADMIN_ROUTES;
