import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStep } from "../components/ui/WorkflowSteps";
import { ORGANIZER_MACRO_STEPS } from "../domain/organizerWorkflow";
import { macroPathToWizardStep } from "../pages/organizer/eventWizardUtils";

interface EventWizardProgressInput {
  macroSteps: WorkflowStep[];
}

export function useEventWizardProgress({ macroSteps }: EventWizardProgressInput) {
  return useMemo(() => {
    const nextMacro = macroSteps.find((step) => step.state === "next" || step.state === "active");
    const nextMacroMeta = nextMacro
      ? ORGANIZER_MACRO_STEPS.find((step) => step.path === nextMacro.to)
      : undefined;

    let nextAction: NextStepAction;
    if (nextMacro?.to && nextMacroMeta) {
      const wizardStep = macroPathToWizardStep(nextMacro.to);
      nextAction = {
        title: `Bước tiếp: ${nextMacro.label}`,
        description: nextMacro.detail ?? nextMacroMeta.detail,
        href: wizardStep,
        cta: `Mở ${nextMacro.label}`
      };
    } else if (macroSteps.every((step) => step.state === "done")) {
      nextAction = {
        title: "Đã hoàn tất thiết lập cơ bản",
        description: "Tiếp tục vận hành cuộc thi từ sidebar hoặc xem lại từng bước bên dưới.",
        href: "#wizard-step-results-hub",
        cta: "Xem Kết quả"
      };
    } else {
      nextAction = {
        title: "Theo dõi tiến độ",
        description: "Chọn bước thiết lập bên dưới để làm việc ngay trên trang này.",
        href: "#wizard-step-basic",
        cta: "Bắt đầu thiết lập"
      };
    }

    return { nextAction };
  }, [macroSteps]);
}
