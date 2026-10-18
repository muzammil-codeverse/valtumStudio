"use client";

import { useRouter } from "next/navigation";
import {
  type FormHTMLAttributes,
  type ReactNode,
  useState,
  useTransition
} from "react";

import type { ActionResult } from "@/modules/cms/shared/types/action-result";

type LeadAction = (formData: FormData) => Promise<ActionResult>;

export function LeadActionForm({
  action,
  children,
  className,
  ...props
}: Omit<FormHTMLAttributes<HTMLFormElement>, "action"> & {
  action: LeadAction;
  children: ReactNode;
}): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      {...props}
      className={className}
      action={(formData) => {
        startTransition(async () => {
          const result = await action(formData);
          setMessage(result.message ?? null);
          if (result.ok) router.refresh();
        });
      }}
    >
      <fieldset disabled={isPending} className="contents">
        {children}
      </fieldset>
      {message === null ? null : (
        <p role="status" className="mt-2 text-xs text-[var(--admin-text-secondary)]">
          {message}
        </p>
      )}
    </form>
  );
}
