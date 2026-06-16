import type { WorkflowStep } from "../components/ui/WorkflowSteps";
import { ORGANIZER_MACRO_STEPS } from "./organizerWorkflow";

export type OrganizerSetupContext = {
  hasTeams: boolean;
  hasBoards: boolean;
  hasSlots: boolean;
  hasProblem: boolean;
  hasRubric: boolean;
  hasStaff: boolean;
};

const SETUP_REQUIRES: Record<string, (ctx: OrganizerSetupContext) => boolean> = {
  basic: () => true,
  boards: (ctx) =>
    ctx.hasBoards && ctx.hasSlots && ctx.hasProblem && ctx.hasStaff && ctx.hasRubric,
  "teams-hub": (ctx) => ctx.hasTeams,
  "board-ops": (ctx) => ctx.hasTeams,
  "artifacts-hub": (ctx) => ctx.hasProblem,
  "results-hub": (ctx) => ctx.hasRubric
};

export function resolveOrganizerSetupSteps(
  ctx: OrganizerSetupContext,
  currentPath?: string
): WorkflowStep[] {
  const firstIncomplete = ORGANIZER_MACRO_STEPS.findIndex(
    (step) => !(SETUP_REQUIRES[step.id] ?? (() => true))(ctx)
  );

  return ORGANIZER_MACRO_STEPS.map((step, index) => {
    const stepDone = (SETUP_REQUIRES[step.id] ?? (() => true))(ctx);

    let state: WorkflowStep["state"];
    if (currentPath && step.path === currentPath) {
      state = "active";
    } else if (stepDone) {
      state = "done";
    } else if (firstIncomplete === -1) {
      state = "done";
    } else if (index === firstIncomplete) {
      state = "next";
    } else {
      state = "blocked";
    }

    return { label: step.label, detail: step.detail, to: step.path, state };
  });
}
