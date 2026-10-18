import type { ReactNode } from "react";

type AuthenticationLayoutProperties = Readonly<{ children: ReactNode }>;

export default function AuthenticationLayout({
  children
}: AuthenticationLayoutProperties): ReactNode {
  return <main className="auth-shell">{children}</main>;
}
