export type BoardOpsStep = "#ops-step-teams";

export function normalizeBoardOpsStep(anchor: string): BoardOpsStep {
  if (
    anchor === "#ops-step-problems" ||
    anchor === "#ops-step-problem" ||
    anchor === "#ops-step-mentor" ||
    anchor === "#ops-step-judge" ||
    anchor === "#ops-step-mentors" ||
    anchor === "#ops-step-assignments"
  ) {
    return "#ops-step-teams";
  }
  if (anchor === "#ops-step-slots") return "#ops-step-teams";
  return "#ops-step-teams";
}

export function resolveBoardOpsStep(
  microSteps: Array<{ anchor?: string; state: string }>
): BoardOpsStep {
  const active = microSteps.find((step) => step.state === "active" && step.anchor);
  if (active?.anchor) return normalizeBoardOpsStep(active.anchor);
  return "#ops-step-teams";
}

export { toIsoFromLocal, toLocalDateTimeInput as toLocalInput } from "../../utils/dateTimeInput";
