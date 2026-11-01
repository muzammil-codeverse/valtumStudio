import type { ReactNode } from "react";

export default function PublicTemplate({
  children
}: {
  children: ReactNode;
}): React.JSX.Element {
  return <div className="v-page-enter">{children}</div>;
}
