"use client";
import { useTransition } from "react";

import { Button } from "@/modules/admin/ui/components/buttons";

import type { ActionResult } from "../types/action-result";
type StateAction = (
  id: string,
  revision: number,
  target: "PUBLISHED" | "ARCHIVED" | "DRAFT"
) => Promise<ActionResult<{ id: string }>>;
export function CmsStateActions({
  id,
  revision,
  status,
  action
}: {
  id: string;
  revision: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  action: StateAction;
}): React.JSX.Element {
  const [pending, startTransition] = useTransition();
  const change = (target: "PUBLISHED" | "ARCHIVED" | "DRAFT") =>
    startTransition(async () => {
      await action(id, revision, target);
    });
  return (
    <div className="flex flex-wrap gap-2">
      <>
        {status === "DRAFT" ? (
          <Button
            type="button"
            variant="primary"
            disabled={pending}
            onClick={() => change("PUBLISHED")}
          >
            Publish
          </Button>
        ) : null}
        {status === "ARCHIVED" ? (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => change("DRAFT")}
          >
            Restore draft
          </Button>
        ) : null}
        {status !== "ARCHIVED" ? (
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={() => change("ARCHIVED")}
          >
            Archive
          </Button>
        ) : null}
      </>
    </div>
  );
}
