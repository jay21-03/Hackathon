import type { ReactNode } from "react";

export type BadgeTone = "success" | "warning" | "neutral" | "active" | "ai" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  success:
    "bg-secondary-container/20 text-secondary border-secondary-container/30",
  warning:
    "bg-tertiary-container/20 text-tertiary border-tertiary-container/30",
  neutral: "bg-surface-variant text-on-surface-variant border-outline-variant",
  active: "bg-secondary-container/90 text-on-secondary-container",
  ai: "bg-tertiary-container/90 text-on-secondary-container",
  danger: "bg-error-container/80 text-on-error-container border-error/40"
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded font-label-sm border backdrop-blur-md ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
