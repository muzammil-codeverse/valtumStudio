import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  "primary" | "secondary" | "tertiary" | "danger" | "text" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "secondary",
  isLoading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps): React.JSX.Element {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  let variantStyles = "";

  switch (variant) {
    case "primary":
      variantStyles =
        "bg-[var(--admin-text)] text-[var(--admin-surface)] hover:opacity-90 px-4 py-2 text-sm rounded-md shadow-xs";
      break;
    case "secondary":
      variantStyles =
        "border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] text-[var(--admin-text)] hover:bg-[var(--admin-surface-hover)] px-4 py-2 text-sm rounded-md shadow-2xs";
      break;
    case "tertiary":
      variantStyles =
        "text-[var(--admin-text)] hover:bg-[var(--admin-surface-hover)] px-4 py-2 text-sm rounded-md";
      break;
    case "danger":
      variantStyles =
        "bg-[var(--admin-danger)] text-[var(--admin-surface)] hover:opacity-90 px-4 py-2 text-sm rounded-md shadow-xs";
      break;
    case "text":
      variantStyles =
        "text-[var(--admin-accent)] hover:underline px-0 py-0 text-sm bg-transparent border-none shadow-none font-normal";
      break;
    case "icon":
      variantStyles =
        "p-2 hover:bg-[var(--admin-surface-hover)] text-[var(--admin-text-secondary)] rounded-md";
      break;
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[var(--admin-text-muted)] border-t-[var(--admin-text)]" />
      ) : null}
      {children}
    </button>
  );
}
