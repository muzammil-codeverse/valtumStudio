export const roles = ["owner", "admin", "editor"] as const;

export type Role = (typeof roles)[number];

export function parseRole(value: unknown): Role {
  if (typeof value === "string" && roles.includes(value as Role)) {
    return value as Role;
  }

  throw new Error("Stored account role is not recognized.");
}
