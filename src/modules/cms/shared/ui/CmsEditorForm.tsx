"use client";

import { useActionState } from "react";

import { Button } from "@/modules/admin/ui/components/buttons";
import {
  FormDescription,
  FormField,
  FormLabel,
  Input,
  Textarea
} from "@/modules/admin/ui/components/forms";

import type { ActionResult } from "../types/action-result";

type Field = Readonly<{
  name: string;
  label: string;
  kind?: "text" | "textarea" | "number" | "checkbox";
  description?: string;
  defaultValue?: string | number | boolean;
}>;

export type CmsServerAction<TData> = (
  state: ActionResult<TData> | undefined,
  formData: FormData
) => Promise<ActionResult<TData>>;

type CmsEditorFormProps<TData> = Readonly<{
  action: CmsServerAction<TData>;
  fields: readonly Field[];
  hidden?: Readonly<Record<string, string | number | undefined>>;
  submitLabel?: string;
  children?: React.ReactNode;
}>;

function renderField(field: Field): React.JSX.Element {
  if (field.kind === "checkbox") {
    return (
      <FormField key={field.name}>
        <label className="flex items-center gap-2 text-sm">
          <input
            defaultChecked={Boolean(field.defaultValue)}
            name={field.name}
            type="checkbox"
          />
          {field.label}
        </label>
      </FormField>
    );
  }

  return (
    <FormField key={field.name}>
      <FormLabel htmlFor={field.name}>{field.label}</FormLabel>
      {field.description ? (
        <FormDescription>{field.description}</FormDescription>
      ) : null}
      {field.kind === "textarea" ? (
        <Textarea
          defaultValue={String(field.defaultValue ?? "")}
          id={field.name}
          name={field.name}
          rows={5}
        />
      ) : (
        <Input
          defaultValue={
            typeof field.defaultValue === "boolean" ? undefined : field.defaultValue
          }
          id={field.name}
          name={field.name}
          type={field.kind === "number" ? "number" : "text"}
        />
      )}
    </FormField>
  );
}

export function CmsEditorForm<TData>(
  props: CmsEditorFormProps<TData>
): React.JSX.Element {
  const { action, children, fields, hidden = {}, submitLabel = "Save draft" } = props;
  const [state, formAction, pending] = useActionState<
    ActionResult<TData> | undefined,
    FormData
  >(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {Object.entries(hidden).map(([name, value]) => {
        if (value === undefined) {
          return null;
        }

        return <input key={name} name={name} type="hidden" value={value} />;
      })}
      {state && !state.ok ? (
        <p
          className="rounded-md border border-[var(--admin-danger)]/30 bg-[var(--admin-danger)]/10 p-3 text-sm text-[var(--admin-danger)]"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p
          className="rounded-md border border-[var(--admin-success)]/30 bg-[var(--admin-success)]/10 p-3 text-sm"
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      {fields.map(renderField)}
      {children}
      <div className="sticky bottom-3 flex justify-end border-t border-[var(--admin-border)] bg-[var(--admin-surface)] pt-4">
        <Button isLoading={pending} type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
