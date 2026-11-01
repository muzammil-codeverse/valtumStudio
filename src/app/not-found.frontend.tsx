import { StudioShell } from "@/modules/public-site/studio/StudioShell";

import PublicNotFound from "./(public)/not-found";

export default function NotFound(): React.JSX.Element {
  return (
    <StudioShell>
      <PublicNotFound />
    </StudioShell>
  );
}
