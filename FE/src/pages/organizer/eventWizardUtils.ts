import type { NextStepAction } from "../../components/ui/NextStepPanel";
import type { WorkflowStep } from "../../components/ui/WorkflowSteps";
import { ORGANIZER_MACRO_STEPS } from "../../domain/organizerWorkflow";

export type EventWizardStep =
  | "#wizard-step-basic"
  | "#wizard-step-teams-hub"
  | "#wizard-step-boards"
  | "#wizard-step-board-ops"
  | "#wizard-step-artifacts-hub"
  | "#wizard-step-results-hub";

const MACRO_ID_TO_STEP: Record<string, EventWizardStep> = {
  basic: "#wizard-step-basic",
  "teams-hub": "#wizard-step-teams-hub",
  boards: "#wizard-step-boards",
  "board-ops": "#wizard-step-board-ops",
  "artifacts-hub": "#wizard-step-artifacts-hub",
  "results-hub": "#wizard-step-results-hub"
};

const LEGACY_HASH: Record<string, EventWizardStep> = {
  "#wizard-step-basic": "#wizard-step-basic",
  "#basic": "#wizard-step-basic",
  "#wizard-step-teams-hub": "#wizard-step-teams-hub",
  "#teams-hub": "#wizard-step-teams-hub",
  "#wizard-step-boards": "#wizard-step-boards",
  "#boards": "#wizard-step-boards",
  "#wizard-step-board-ops": "#wizard-step-board-ops",
  "#board-ops": "#wizard-step-board-ops",
  "#wizard-step-artifacts-hub": "#wizard-step-artifacts-hub",
  "#artifacts-hub": "#wizard-step-artifacts-hub",
  "#wizard-step-results-hub": "#wizard-step-results-hub",
  "#results-hub": "#wizard-step-results-hub",
  "#wizard-phase-setup": "#wizard-step-basic",
  "#setup": "#wizard-step-basic",
  "#wizard-phase-ops": "#wizard-step-boards",
  "#ops": "#wizard-step-boards",
  "#wizard-phase-results": "#wizard-step-results-hub",
  "#results": "#wizard-step-results-hub"
};

export function macroIdToWizardStep(macroId: string): EventWizardStep | undefined {
  return MACRO_ID_TO_STEP[macroId];
}

export function macroPathToWizardStep(path: string): EventWizardStep | undefined {
  const macro = ORGANIZER_MACRO_STEPS.find((step) => step.path === path);
  return macro ? macroIdToWizardStep(macro.id) : undefined;
}

export function normalizeEventWizardStep(anchor: string): EventWizardStep {
  return LEGACY_HASH[anchor] ?? "#wizard-step-basic";
}

export function resolveEventWizardStep(
  macroSteps: WorkflowStep[],
  macroIds: string[] = ORGANIZER_MACRO_STEPS.map((step) => step.id)
): EventWizardStep {
  const active = macroSteps.find((step) => step.state === "active");
  if (active) {
    const index = macroSteps.indexOf(active);
    const macroId = macroIds[index];
    if (macroId) return macroIdToWizardStep(macroId) ?? "#wizard-step-basic";
  }
  const next = macroSteps.find((step) => step.state === "next");
  if (next) {
    const index = macroSteps.indexOf(next);
    const macroId = macroIds[index];
    if (macroId) return macroIdToWizardStep(macroId) ?? "#wizard-step-basic";
  }
  const lastDoneIndex = [...macroSteps].reverse().findIndex((step) => step.state === "done");
  if (lastDoneIndex >= 0) {
    const index = macroSteps.length - 1 - lastDoneIndex;
    const macroId = macroIds[index];
    if (macroId) return macroIdToWizardStep(macroId) ?? "#wizard-step-basic";
  }
  return "#wizard-step-basic";
}

export function buildWizardMacroSteps(
  macroSteps: WorkflowStep[],
  macroIds: string[] = ORGANIZER_MACRO_STEPS.map((step) => step.id)
): WorkflowStep[] {
  return macroSteps.map((step, index) => ({
    ...step,
    to: undefined,
    href: macroIdToWizardStep(macroIds[index] ?? "basic")
  }));
}

export function visibleWizardMacroIds(showArtifactsStep: boolean): string[] {
  return ORGANIZER_MACRO_STEPS.filter(
    (macro) => macro.id !== "artifacts-hub" || showArtifactsStep
  ).map((macro) => macro.id);
}

export function filterSetupStepsForWizard(
  steps: WorkflowStep[],
  macroIds: string[]
): WorkflowStep[] {
  return steps.filter((_, index) => {
    const macro = ORGANIZER_MACRO_STEPS[index];
    return macro != null && macroIds.includes(macro.id);
  });
}

export function rewriteNextActionForWizard(action: NextStepAction): NextStepAction {
  if (!action.to) return action;
  const wizardStep = macroPathToWizardStep(action.to);
  if (!wizardStep) return action;
  return { ...action, to: undefined, href: wizardStep };
}
