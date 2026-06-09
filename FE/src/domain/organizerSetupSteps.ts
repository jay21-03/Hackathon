import type { WorkflowStep } from "../components/ui/WorkflowSteps";
import { ORGANIZER_MACRO_STEPS } from "./organizerWorkflow";

export type OrganizerSetupContext = {
  hasTeams: boolean;
  hasBoards: boolean;
  hasProblem: boolean;
  hasRubric: boolean;
};

const SETUP_REQUIRES: Record<string, (ctx: OrganizerSetupContext) => boolean> = {
  basic: () => true,
  registrations: (ctx) => ctx.hasTeams,
  invitations: (ctx) => ctx.hasTeams,
  boards: (ctx) => ctx.hasBoards,
  problems: (ctx) => ctx.hasProblem,
  assignments: (ctx) => ctx.hasBoards,
  rubric: (ctx) => ctx.hasRubric
};

export function resolveOrganizerSetupSteps(
  ctx: OrganizerSetupContext,
  currentPath?: string
): WorkflowStep[] {
  let lastDone = -1;
  for (let i = 0; i < ORGANIZER_MACRO_STEPS.length; i++) {
    const step = ORGANIZER_MACRO_STEPS[i];
    const requires = SETUP_REQUIRES[step.id] ?? (() => true);
    if (requires(ctx)) lastDone = i;
  }

  return ORGANIZER_MACRO_STEPS.map((step, index) => {
    let state: WorkflowStep["state"];
    if (currentPath && step.path === currentPath) {
      state = "active";
    } else if (index <= lastDone) {
      state = "done";
    } else if (index === lastDone + 1) {
      state = "next";
    } else {
      state = "blocked";
    }
    return { label: step.label, detail: step.detail, to: step.path, state };
  });
}
