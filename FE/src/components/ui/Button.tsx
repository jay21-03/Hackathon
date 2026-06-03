import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "google";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-container text-on-primary-container shadow-sm hover:bg-primary",
  secondary:
    "border border-outline-variant bg-surface text-on-surface shadow-sm hover:bg-surface-container-high",
  ghost:
    "border border-transparent bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
  google:
    "border border-outline-variant bg-surface text-on-surface shadow-sm hover:bg-surface-container-high"
};

export function Button({
  variant = "primary",
  children,
  icon,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-label-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
