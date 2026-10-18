import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  session: ["list", "revoke"],
  user: ["ban", "create", "get", "set-password", "set-role", "update"]
} as const;

export const pluginAccessControl = createAccessControl(statement);

export const pluginRoles = {
  admin: pluginAccessControl.newRole({ session: ["list", "revoke"] }),
  editor: pluginAccessControl.newRole({}),
  owner: pluginAccessControl.newRole({
    session: ["list", "revoke"],
    user: ["ban", "create", "get", "set-password", "set-role", "update"]
  })
};
