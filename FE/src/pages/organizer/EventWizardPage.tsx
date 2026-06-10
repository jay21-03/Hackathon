import { useEffect, useMemo, useState } from "react";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { enableGithubProvisioning, enableSubmissions } from "../../config/features";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { ArtifactsHubPage } from "./ArtifactsHubPage";
import { BoardManagementPage } from "./BoardManagementPage";
import { BoardOperationsPage } from "./BoardOperationsPage";
import { EventBasicInfoPage } from "./EventBasicInfoPage";
import { ResultsHubPage } from "./ResultsHubPage";
import { TeamsHubPage } from "./TeamsHubPage";
import {
  buildWizardMacroSteps,
  filterSetupStepsForWizard,
  normalizeEventWizardStep,
  resolveEventWizardStep,
  visibleWizardMacroIds,
  type EventWizardStep
} from "./eventWizardUtils";

export function EventWizardPage() {
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { steps, loading: setupLoading } = useEventSetupProgress(eventId, "/organizer/events/wizard");
  const [activeStep, setActiveStep] = useState<EventWizardStep | null>(null);
  const showArtifactsStep = enableSubmissions || enableGithubProvisioning;
  const wizardMacroIds = useMemo(
    () => visibleWizardMacroIds(showArtifactsStep),
    [showArtifactsStep]
  );
  const visibleSteps = useMemo(
    () => filterSetupStepsForWizard(steps, wizardMacroIds),
    [steps, wizardMacroIds]
  );
  const currentStep = activeStep ?? resolveEventWizardStep(visibleSteps, wizardMacroIds);
  const wizardSteps = buildWizardMacroSteps(visibleSteps, wizardMacroIds);

  function goToStep(anchor: string) {
    const step = normalizeEventWizardStep(anchor);
    setActiveStep(step);
    window.history.replaceState(null, "", `/organizer/events/wizard${step}`);
  }

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) setActiveStep(normalizeEventWizardStep(hash));
  }, []);

  if (eventLoading || setupLoading) {
    return <ModuleSkeleton rows={5} />;
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Thiết lập cuộc thi"
        title="Quy trình vận hành"
        description="Làm việc trực tiếp từng bước thiết lập — trạng thái tính từ dữ liệu thật của cuộc thi đang chọn."
        actions={<OrganizerContextBar />}
      />

      <WorkflowSteps
        title="Các bước thiết lập"
        description="Chọn một bước — mỗi lần chỉ hiện nội dung bước đó."
        steps={wizardSteps}
        activeHref={currentStep}
        onStepSelect={(href) => goToStep(href)}
      />

      {currentStep === "#wizard-step-basic" ? (
        <EventBasicInfoPage embedded onWizardStep={goToStep} />
      ) : null}
      {currentStep === "#wizard-step-teams-hub" ? (
        <TeamsHubPage embedded onWizardStep={goToStep} />
      ) : null}
      {currentStep === "#wizard-step-boards" ? (
        <BoardManagementPage embedded onWizardStep={goToStep} />
      ) : null}
      {currentStep === "#wizard-step-board-ops" ? (
        <BoardOperationsPage embedded onWizardStep={goToStep} />
      ) : null}
      {currentStep === "#wizard-step-artifacts-hub" && showArtifactsStep ? (
        <ArtifactsHubPage embedded onWizardStep={goToStep} />
      ) : null}
      {currentStep === "#wizard-step-results-hub" ? (
        <ResultsHubPage embedded onWizardStep={goToStep} />
      ) : null}
    </div>
  );
}
