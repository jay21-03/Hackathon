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
    <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
      <div className="flex flex-col gap-xs">
        <h2 className="font-headline-sm text-on-surface">{title}</h2>
        <p className="font-body-sm text-on-surface-variant">{description}</p>
      </div>

      <div className="mt-md grid gap-sm sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const state = step.state ?? "next";
          const content = (
            <>
              <div className="flex items-start justify-between gap-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                    <Icon name={stateIcon[state]} className="text-[19px]" filled={state !== "next"} />
                  </span>
                  <span className="font-label-md text-on-surface">{step.label}</span>
                </div>
                <Badge tone={stateTone[state]}>{stateLabel[state]}</Badge>
              </div>
              <p className="mt-sm font-body-sm text-on-surface-variant">{step.detail}</p>
            </>
          );

          const isSelected = Boolean(activeHref && step.href && activeHref === step.href);
          const className = [
            "min-h-[124px] rounded-lg border bg-surface-container-low p-md text-left transition-colors hover:bg-surface-variant",
            isSelected ? "border-primary ring-2 ring-primary/30" : "border-outline-variant",
            step.state === "blocked" ? "cursor-not-allowed opacity-60" : ""
          ]
            .filter(Boolean)
            .join(" ");

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
