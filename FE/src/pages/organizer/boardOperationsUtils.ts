export type BoardOpsStep = "#ops-step-problem" | "#ops-step-mentor" | "#ops-step-judge";

export function normalizeBoardOpsStep(anchor: string): BoardOpsStep {
  if (anchor === "#ops-step-problems") return "#ops-step-problem";
  if (anchor === "#ops-step-assignments" || anchor === "#ops-step-judge") {
    return anchor === "#ops-step-assignments" ? "#ops-step-mentor" : "#ops-step-judge";
  }
  if (anchor === "#ops-step-mentors") return "#ops-step-mentor";
  return anchor as BoardOpsStep;
}

export function resolveBoardOpsStep(
  microSteps: Array<{ anchor?: string; state: string }>
): BoardOpsStep {
  const active = microSteps.find((step) => step.state === "active" && step.anchor);
  if (active?.anchor) return normalizeBoardOpsStep(active.anchor);
  const lastDone = [...microSteps].reverse().find((step) => step.state === "done" && step.anchor);
  if (lastDone?.anchor) return normalizeBoardOpsStep(lastDone.anchor);
  return "#ops-step-problem";
}

export { toIsoFromLocal, toLocalDateTimeInput as toLocalInput } from "../../utils/dateTimeInput";
