import type { ProgressStepState } from "../../hooks/useParticipantEventProgress";
import { Icon } from "../ui/Icon";

const stateStyles: Record<ProgressStepState, string> = {
  done: "bg-secondary-container/30 text-on-surface",
  active: "bg-primary-container/40 text-on-primary-container",
  next: "border border-dashed border-outline-variant text-on-surface-variant",
  blocked: "bg-surface-container text-outline"
};

function StepIcon({ state }: { state: ProgressStepState }) {
  if (state === "done") {
    return <Icon name="check_circle" className="text-[14px] text-secondary" />;
  }
  if (state === "active" || state === "next") {
    return <span className="h-1.5 w-1.5 rounded-full bg-primary" />;
  }
  return <span className="h-1.5 w-1.5 rounded-full bg-outline-variant" />;
}

interface EventProgressStripProps {
  steps: { label: string; state: ProgressStepState }[];
}

export function EventProgressStrip({ steps }: EventProgressStripProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {steps.map((step) => (
        <span
          key={step.label}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-label-sm normal-case ${stateStyles[step.state]}`}
        >
          <StepIcon state={step.state} />
          {step.label}
        </span>
      ))}
    </div>
  );
}
