import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "google";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-container text-on-primary-container hover:opacity-90 shadow-[0_0_15px_rgba(77,142,255,0.2)]",
  secondary:
    "bg-transparent border border-primary text-primary hover:bg-primary/10",
  ghost:
    "bg-surface-bright hover:bg-surface-variant border border-outline-variant text-on-surface",
  google:
    "bg-surface-bright hover:bg-surface-variant border border-outline-variant text-on-surface"
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-label-md transition-colors duration-200 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
