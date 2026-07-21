import { Link } from "react-router-dom";
import { Badge } from "./Badge";
import { Icon } from "./Icon";

export interface WorkflowStep {
  label: string;
  detail: string;
  to?: string;
  /** In-page anchor on same route */
  href?: string;
  state?: "done" | "active" | "next" | "blocked";
}

const stateTone = {
  done: "success",
  active: "active",
  next: "neutral",
  blocked: "warning"
} as const;

const stateLabel = {
  done: "Hoàn tất",
  active: "Đang xử lý",
  next: "Tiếp theo",
  blocked: "Chờ bước trước"
};

const stateIcon = {
  done: "check_circle",
  active: "radio_button_checked",
  next: "radio_button_unchecked",
  blocked: "warning"
};

interface WorkflowStepsProps {
  title: string;
  description: string;
  steps: WorkflowStep[];
  /** Khi set — chọn bước thay vì scroll; ô đang chọn được highlight */
  activeHref?: string;
  onStepSelect?: (href: string, step: WorkflowStep) => void;
}

export function WorkflowSteps({ title, description, steps, activeHref, onStepSelect }: WorkflowStepsProps) {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface-container p-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="min-w-0">
          <h2 className="font-title-md text-on-surface">{title}</h2>
          <p className="font-body-sm text-on-surface-variant">{description}</p>
        </div>
        <Badge tone="neutral">{steps.length} bước</Badge>
      </div>

      <div className="mt-sm flex gap-sm overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const state = step.state ?? "next";
          const content = (
            <>
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container font-label-sm text-on-primary-container">
                  {index + 1}
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                  <Icon name={stateIcon[state]} className="text-[18px]" filled={state !== "next"} />
                </span>
                <span className="min-w-0 flex-1 truncate font-label-md text-on-surface" title={step.label}>
                  {step.label}
                </span>
                {step.state !== "blocked" ? (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-primary">
                    <Icon name="arrow_forward" className="text-[18px]" />
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex items-center justify-between gap-sm">
                <p className="min-w-0 truncate font-body-sm text-on-surface-variant" title={step.detail}>
                  {step.detail}
                </p>
                <Badge tone={stateTone[state]}>{stateLabel[state]}</Badge>
              </div>
            </>
          );

          const isSelected = Boolean(activeHref && step.href && activeHref === step.href);
          const className = [
            "min-h-[82px] w-[18rem] shrink-0 rounded-lg border bg-surface-container-low p-sm text-left transition-colors hover:bg-surface-variant",
            isSelected ? "border-primary ring-2 ring-primary/30" : "border-outline-variant",
            step.state === "blocked" ? "cursor-not-allowed opacity-60" : ""
          ]
            .filter(Boolean)
            .join(" ");

          const blocked = step.state === "blocked";

          if (blocked) {
            return (
              <div
                key={`${step.label}-${index}`}
                className={className}
                title="Hoàn tất bước trước để mở bước này"
                aria-disabled="true"
              >
                {content}
              </div>
            );
          }

          return step.to ? (
            <Link key={`${step.label}-${index}`} to={step.to} className={className}>
              {content}
            </Link>
          ) : step.href && onStepSelect ? (
            <button
              key={`${step.label}-${index}`}
              type="button"
              className={className}
              onClick={() => onStepSelect(step.href!, step)}
            >
              {content}
            </button>
          ) : step.href ? (
            <a key={`${step.label}-${index}`} href={step.href} className={className}>
              {content}
            </a>
          ) : (
            <div key={`${step.label}-${index}`} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
