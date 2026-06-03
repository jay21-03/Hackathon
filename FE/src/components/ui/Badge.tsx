import type { ReactNode } from "react";

export type BadgeTone = "success" | "warning" | "neutral" | "active" | "ai" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  neutral: "border-outline-variant bg-surface-container-high text-on-surface-variant",
  active: "border-primary/20 bg-primary-fixed text-on-primary-fixed",
  ai: "border-violet-200 bg-violet-50 text-violet-700",
  danger: "border-red-200 bg-red-50 text-red-700"
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 font-label-sm border ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
