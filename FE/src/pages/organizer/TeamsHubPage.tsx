import { useEffect, useState } from "react";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventTeamSummary } from "../../hooks/useEventTeamSummary";
import { useTeamsHubProgress } from "../../hooks/useTeamsHubProgress";
import { RegistrationManagementPage } from "./RegistrationManagementPage";
import { handleEmbeddedNextStep, type HubEmbedProps } from "../../utils/hubEmbedUtils";
import { macroPathToWizardStep } from "./eventWizardUtils";
import {
  normalizeTeamsHubStep,
  resolveTeamsHubStep,
  type TeamsHubStep
} from "./teamsHubUtils";

export function TeamsHubPage({ embedded = false, onWizardStep }: HubEmbedProps = {}) {
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { summary, loading: summaryLoading } = useEventTeamSummary(eventId);

  const confirmedTeams = summary?.confirmedCount ?? 0;
  const pendingTeams = summary?.pendingCount ?? 0;

  const { microSteps } = useTeamsHubProgress({ confirmedTeams, pendingTeams });

  const [activeStep, setActiveStep] = useState<TeamsHubStep | null>(null);
  const currentStep = activeStep ?? resolveTeamsHubStep(microSteps);

  function goToStep(anchor: string) {
    const step = normalizeTeamsHubStep(anchor);
    setActiveStep(step);
    if (!embedded) {
      window.history.replaceState(null, "", `/organizer/teams-hub${step}`);
    }
  }

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#teams-step-invitations-staff") {
      window.location.replace("/organizer/staff#staff-step-invitations");
      return;
    }
    if (hash) setActiveStep(normalizeTeamsHubStep(hash));
  }, []);

  if (eventLoading || summaryLoading) {
    return <ModuleSkeleton rows={5} variant="table" />;
  }

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <PageHeader
          eyebrow="Thiết lập"
          title="Đội & lời mời"
          description="Duyệt đăng ký đội và theo dõi lời mời thành viên — mời GK/mentor tại trang Giám khảo & mentor."
          actions={<OrganizerContextBar />}
        />
      ) : null}

      <WorkflowSteps
        title="Các bước trên trang này"
        description="Chọn một bước — mỗi lần chỉ hiện nội dung bước đó."
        activeHref={currentStep}
        onStepSelect={(href) => handleEmbeddedNextStep(href, embedded, onWizardStep, goToStep)}
        steps={microSteps.map((step) => {
          if (embedded && step.to) {
            const wizardHref = macroPathToWizardStep(step.to);
            if (wizardHref) {
              return {
                label: step.label,
                detail: step.detail,
                href: wizardHref,
                state: step.state
              };
            }
          }
          return {
            label: step.label,
            detail: step.detail,
            href: step.anchor,
            to: step.to,
            state: step.state
          };
        })}
      />

      {currentStep === "#teams-step-registrations" ? <RegistrationManagementPage embedded /> : null}
    </div>
  );
}
