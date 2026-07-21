/* eslint-disable react-refresh/only-export-components */
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "google";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-container text-on-primary-container shadow-sm hover:bg-primary",
  secondary:
    "border border-outline-variant bg-surface text-on-surface shadow-sm hover:bg-surface-container-high",
  ghost:
    "border border-transparent bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
  danger:
    "border border-error/40 bg-error-container text-on-error-container shadow-sm hover:bg-error/15",
  google:
    "border border-outline-variant bg-surface text-on-surface shadow-sm hover:bg-surface-container-high"
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-2 font-label-sm normal-case",
  md: "px-4 py-2.5 font-label-md"
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className = ""
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return `inline-flex items-center justify-center gap-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`;
}

export function Button({
  variant = "primary",
  children,
  icon,
  loading = false,
  size = "md",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={buttonClassName({ variant, size, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="material-symbols-outlined text-[18px]">sync</span> : icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClassName({ variant, size, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}
