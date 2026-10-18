import type { ReactNode } from "react";

type PublicLayoutProperties = Readonly<{
  children: ReactNode;
}>;

export default function PublicLayout({ children }: PublicLayoutProperties): ReactNode {
  return children;
}
