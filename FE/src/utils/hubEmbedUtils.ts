import type { NextStepAction } from "../components/ui/NextStepPanel";
import { rewriteNextActionForWizard } from "../pages/organizer/eventWizardUtils";

export interface HubEmbedProps {
  embedded?: boolean;
  onWizardStep?: (anchor: string) => void;
}

export function resolveEmbeddedNextAction(
  action: NextStepAction,
  embedded?: boolean
): NextStepAction {
  return embedded ? rewriteNextActionForWizard(action) : action;
}

export function handleEmbeddedNextStep(
  href: string,
  embedded: boolean | undefined,
  onWizardStep: ((anchor: string) => void) | undefined,
  localGoToStep: (href: string) => void
) {
  if (embedded && href.startsWith("#wizard-step-") && onWizardStep) {
    onWizardStep(href);
    return;
  }
  localGoToStep(href);
}
