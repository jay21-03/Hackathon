import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-md border-b border-outline-variant pb-lg md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="font-label-sm normal-case text-primary">{eyebrow}</p>}
        <h1 className="font-headline-lg text-on-surface">{title}</h1>
        {description && (
          <p className="mt-xs max-w-3xl font-body-md text-on-surface-variant">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-sm">{actions}</div>}
    </section>
  );
}
