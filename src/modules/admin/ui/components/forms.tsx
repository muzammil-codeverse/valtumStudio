import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes
} from "react";

export function FormSection({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div className="border-b border-[var(--admin-border)] pb-6 mb-6">
      <h3 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h3>
      {description ? (
        <p className="text-xs text-[var(--admin-text-secondary)] mt-1 mb-4 leading-relaxed max-w-2xl">
          {description}
        </p>
      ) : (
        <div className="mb-4" />
      )}
      <div className="space-y-4 max-w-xl">{children}</div>
    </div>
  );
}

export function FormField({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return <div className={`space-y-1.5 ${className}`}>{children}</div>;
}

export function FormLabel({
  children,
  className = "",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>): React.JSX.Element {
  return (
    <label
      className={`block text-xs font-semibold text-[var(--admin-text)] ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}

export function FormDescription({
  children
}: {
  children: ReactNode;
}): React.JSX.Element {
  return (
    <p className="text-[11px] text-[var(--admin-text-secondary)] leading-normal">
      {children}
    </p>
  );
}

export function FormControl({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="relative mt-1">{children}</div>;
}

export function FormError({
  children,
  id
}: {
  children: ReactNode;
  id?: string;
}): React.JSX.Element {
  if (!children) return <></>;
  return (
    <p
      id={id}
      className="text-xs font-medium text-[var(--admin-danger)] mt-1"
      role="alert"
    >
      {children}
    </p>
  );
}

export function FormActions({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={`flex items-center justify-end gap-3 border-t border-[var(--admin-border)] pt-5 mt-6 ${className}`}
    >
      {children}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({
  className = "",
  error = false,
  ...props
}: InputProps): React.JSX.Element {
  return (
    <input
      className={`w-full block text-xs px-3 py-2 border rounded-md bg-[var(--admin-surface)] text-[var(--admin-text)] placeholder-[var(--admin-text-muted)] focus:outline-hidden focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-focus)] disabled:opacity-50 disabled:bg-[var(--admin-surface-subtle)] disabled:cursor-not-allowed ${
        error
          ? "border-[var(--admin-danger)] focus:ring-red-100"
          : "border-[var(--admin-border-strong)]"
      } ${className}`}
      {...props}
    />
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({
  className = "",
  error = false,
  rows = 3,
  ...props
}: TextareaProps): React.JSX.Element {
  return (
    <textarea
      rows={rows}
      className={`w-full block text-xs px-3 py-2 border rounded-md bg-[var(--admin-surface)] text-[var(--admin-text)] placeholder-[var(--admin-text-muted)] focus:outline-hidden focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-focus)] disabled:opacity-50 disabled:bg-[var(--admin-surface-subtle)] disabled:cursor-not-allowed ${
        error
          ? "border-[var(--admin-danger)] focus:ring-red-100"
          : "border-[var(--admin-border-strong)]"
      } ${className}`}
      {...props}
    />
  );
}

export function Checkbox({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }): React.JSX.Element {
  return (
    <label
      className={`flex items-center gap-2 cursor-pointer select-none text-xs text-[var(--admin-text-secondary)] ${className}`}
    >
      <input
        type="checkbox"
        className="w-4 h-4 rounded-sm border-[var(--admin-border-strong)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)] bg-[var(--admin-surface)] disabled:opacity-50 disabled:cursor-not-allowed"
        {...props}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}

export function SelectWrapper({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return <div className={`relative ${className}`}>{children}</div>;
}
