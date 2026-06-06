import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthFormShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthFormShell({ title, subtitle, children, footer }: AuthFormShellProps) {
  return (
    <main className="relative z-10 w-full max-w-[440px] px-page">
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
        <div className="border-b border-outline-variant bg-surface-container-low px-xl py-lg">
          <h1 className="font-headline-md text-on-surface">{title}</h1>
          {subtitle ? (
            <p className="mt-xs font-body-sm text-on-surface-variant">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-md p-xl">{children}</div>
        {footer ? (
          <div className="border-t border-outline-variant bg-surface-container-high px-xl py-md text-center font-body-sm text-on-surface-variant">
            {footer}
          </div>
        ) : null}
      </div>
      <p className="mt-md text-center font-body-sm text-on-surface-variant">
        <Link to="/events" className="text-primary hover:underline">
          Xem danh sách cuộc thi
        </Link>
      </p>
    </main>
  );
}

export function AuthDivider() {
  return (
    <div className="relative py-xs text-center">
      <div className="absolute inset-x-0 top-1/2 border-t border-outline-variant" />
      <span className="relative bg-surface px-sm font-label-sm text-on-surface-variant">hoặc</span>
    </div>
  );
}

export function AuthFieldLabel({
  label,
  required,
  hint,
  children
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-xs font-label-md text-on-surface">
      <span>
        {label}
        {required ? <span className="text-error">*</span> : null}
      </span>
      {children}
      {hint ? <span className="font-body-sm text-on-surface-variant">{hint}</span> : null}
    </label>
  );
}

export function authInputClassName(extra = "") {
  return `w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 font-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${extra}`;
}

export function AuthAlert({ tone, children }: { tone: "error" | "warning"; children: ReactNode }) {
  const toneClass =
    tone === "error"
      ? "border-error/40 bg-error-container/40"
      : "border-warning/40 bg-warning-container/60";
  return (
    <div className={`rounded-lg border px-md py-sm ${toneClass}`}>
      <p className="font-body-sm text-on-surface">{children}</p>
    </div>
  );
}

