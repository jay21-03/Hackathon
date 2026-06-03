import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container p-lg text-center">
      <Icon name={icon} className="mx-auto mb-sm text-4xl text-outline" />
      <h2 className="font-headline-sm text-on-surface">{title}</h2>
      <p className="mx-auto mt-xs max-w-md font-body-sm text-on-surface-variant">{description}</p>
      {action && <div className="mt-md flex justify-center">{action}</div>}
    </div>
  );
}
