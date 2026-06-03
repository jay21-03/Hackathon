import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon: string;
  tone?: "primary" | "success" | "warning" | "danger";
  children?: ReactNode;
}

const toneClasses = {
  primary: "bg-primary-fixed text-on-primary-fixed",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700"
};

export function StatCard({
  label,
  value,
  helper,
  icon,
  tone = "primary",
  children
}: StatCardProps) {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface p-md shadow-sm">
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <p className="font-label-sm normal-case text-on-surface-variant">{label}</p>
          <p className="mt-xs truncate font-headline-lg text-on-surface">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon name={icon} filled className="text-[22px]" />
        </div>
      </div>
      {helper && <p className="mt-sm font-body-sm text-on-surface-variant">{helper}</p>}
      {children && <div className="mt-md">{children}</div>}
    </article>
  );
}
