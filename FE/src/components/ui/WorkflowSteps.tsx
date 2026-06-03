import { Link } from "react-router-dom";
import { Badge } from "./Badge";
import { Icon } from "./Icon";

export interface WorkflowStep {
  label: string;
  detail: string;
  to?: string;
  state?: "done" | "active" | "next" | "blocked";
}

const stateTone = {
  done: "success",
  active: "active",
  next: "neutral",
  blocked: "warning"
} as const;

const stateLabel = {
  done: "Hoan tat",
  active: "Dang xu ly",
  next: "Tiep theo",
  blocked: "Can kiem tra"
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
}

export function WorkflowSteps({ title, description, steps }: WorkflowStepsProps) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
      <div className="flex flex-col gap-xs">
        <h2 className="font-headline-sm text-on-surface">{title}</h2>
        <p className="font-body-sm text-on-surface-variant">{description}</p>
      </div>

      <div className="mt-md grid gap-sm xl:grid-cols-5">
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

          const className =
            "min-h-[124px] rounded-lg border border-outline-variant bg-surface-container-low p-md text-left transition-colors hover:bg-surface-variant";

          return step.to ? (
            <Link key={`${step.label}-${index}`} to={step.to} className={className}>
              {content}
            </Link>
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
