import type { ReactNode } from "react";

export type BadgeTone = "success" | "warning" | "neutral" | "active" | "ai" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200",
  warning:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-100",
  neutral: "border-outline-variant bg-surface-container-high text-on-surface-variant",
  active: "border-primary/20 bg-primary-fixed text-on-primary-fixed",
  ai: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-200",
  danger:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-200"
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
