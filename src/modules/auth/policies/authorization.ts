import type { Role } from "@/modules/auth/domain/roles";

export const resources = [
  "dashboard",
  "siteSettings",
  "navigation",
  "services",
  "projects",
  "insights",
  "faqs",
  "team",
  "media",
  "leads",
  "users",
  "sessions",
  "securityEvents",
  "audit",
  "system"
] as const;

export const actions = [
  "read",
  "create",
  "update",
  "publish",
  "archive",
  "delete",
  "manage",
  "revoke"
] as const;

export type Resource = (typeof resources)[number];
export type Action = (typeof actions)[number];

type PermissionMatrix = Readonly<
  Record<Role, Readonly<Record<Resource, readonly Action[]>>>
>;

const none: readonly Action[] = [];
const draftContent = ["read", "create", "update"] as const;
const managedContent = [
  "read",
  "create",
  "update",
  "publish",
  "archive",
  "delete",
  "manage"
] as const;

export const permissionMatrix: PermissionMatrix = {
  admin: {
    audit: ["read"],
    dashboard: ["read"],
    faqs: managedContent,
    insights: managedContent,
    leads: ["read", "update", "manage"],
    media: managedContent,
    navigation: managedContent,
    projects: managedContent,
    securityEvents: none,
    services: managedContent,
    sessions: ["read", "revoke"],
    siteSettings: ["read", "update"],
    system: none,
    team: managedContent,
    users: none
  },
  editor: {
    audit: none,
    dashboard: ["read"],
    faqs: draftContent,
    insights: draftContent,
    leads: none,
    media: draftContent,
    navigation: draftContent,
    projects: draftContent,
    securityEvents: none,
    services: draftContent,
    sessions: ["read", "revoke"],
    siteSettings: none,
    system: none,
    team: draftContent,
    users: none
  },
  owner: {
    audit: ["read"],
    dashboard: ["read", "manage"],
    faqs: managedContent,
    insights: managedContent,
    leads: ["read", "update", "manage"],
    media: managedContent,
    navigation: managedContent,
    projects: managedContent,
    securityEvents: ["read"],
    services: managedContent,
    sessions: ["read", "revoke", "manage"],
    siteSettings: ["read", "update", "manage"],
    system: ["read", "update", "manage"],
    team: managedContent,
    users: ["read", "create", "update", "manage"]
  }
};

export type Permission = Readonly<{ action: Action; resource: Resource }>;

export function can(role: Role, permission: Permission): boolean {
  return permissionMatrix[role][permission.resource].includes(permission.action);
}

export class AuthorizationError extends Error {
  public constructor() {
    super("The requested operation is not permitted.");
    this.name = "AuthorizationError";
  }
}

export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new AuthorizationError();
  }
}
