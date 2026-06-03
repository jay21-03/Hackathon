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
  primary: "bg-primary-container text-on-primary-container",
  success: "bg-secondary-container text-on-secondary-container",
  warning: "bg-tertiary-container text-on-tertiary-container",
  danger: "bg-error-container text-on-error-container"
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
    <article className="rounded-xl border border-outline-variant bg-surface-container p-md">
      <div className="flex items-start justify-between gap-md">
        <div>
          <p className="font-label-sm normal-case text-on-surface-variant">{label}</p>
          <p className="mt-xs font-headline-lg text-on-surface">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon name={icon} filled className="text-[22px]" />
        </div>
      </div>
      {helper && <p className="mt-sm font-body-sm text-on-surface-variant">{helper}</p>}
      {children && <div className="mt-md">{children}</div>}
    </article>
  );
}
