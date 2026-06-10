import { useMemo, useEffect, useState } from "react";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { enableStaffInvitations } from "../../config/features";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { useEventTeams } from "../../hooks/useEventTeams";
import { useTeamsHubProgress } from "../../hooks/useTeamsHubProgress";
import { InvitationManagementPage } from "./InvitationManagementPage";
import { RegistrationManagementPage } from "./RegistrationManagementPage";
import { type HubEmbedProps } from "../../utils/hubEmbedUtils";
import {
  normalizeTeamsHubStep,
  resolveTeamsHubStep,
  type TeamsHubStep
} from "./teamsHubUtils";

export function TeamsHubPage({ embedded = false, onWizardStep }: HubEmbedProps = {}) {
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { steps: setupSteps, loading: setupLoading } = useEventSetupProgress(
    eventId,
    embedded ? "/organizer/events/wizard" : "/organizer/teams-hub"
  );
  const { teams, loading: teamsLoading } = useEventTeams(eventId, { size: 500 });

  const confirmedTeams = useMemo(
    () => teams.filter((team) => team.status === "CONFIRMED").length,
    [teams]
  );
  const pendingTeams = useMemo(
    () => teams.filter((team) => team.status === "PENDING").length,
    [teams]
  );

  const { microSteps } = useTeamsHubProgress({
    confirmedTeams,
    pendingTeams,
    showStaffInvitations: enableStaffInvitations
  });

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
    if (hash) setActiveStep(normalizeTeamsHubStep(hash));
  }, []);

  if (eventLoading || setupLoading || teamsLoading) {
    return <ModuleSkeleton rows={5} variant="table" />;
  }

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <PageHeader
          eyebrow="Thiết lập"
          title="Đội & lời mời"
          description="Duyệt đăng ký, theo dõi lời mời thành viên và staff — một luồng liền mạch."
          actions={<OrganizerContextBar />}
        />
      ) : null}

      {!embedded ? (
        <WorkflowSteps
          title="Quy trình thiết lập"
          description="Cùng thứ tự với sidebar."
          steps={setupSteps}
          activeHref="/organizer/teams-hub"
        />
      ) : null}

      <WorkflowSteps
        title="Các bước trên trang này"
        description="Chọn một bước — mỗi lần chỉ hiện nội dung bước đó."
        activeHref={currentStep}
        onStepSelect={(href) => goToStep(href)}
        steps={microSteps.map((step) => ({
          label: step.label,
          detail: step.detail,
          href: step.anchor,
          to: step.to,
          state: step.state
        }))}
      />

      {currentStep === "#teams-step-registrations" ? <RegistrationManagementPage embedded /> : null}
      {currentStep === "#teams-step-invitations-members" ? (
        <InvitationManagementPage embedded forcedTab="members" />
      ) : null}
      {currentStep === "#teams-step-invitations-staff" && enableStaffInvitations ? (
        <InvitationManagementPage embedded forcedTab="staff" />
      ) : null}
      {currentStep === "#teams-step-invitations-templates" ? (
        <InvitationManagementPage embedded forcedTab="templates" />
      ) : null}
    </div>
  );
}
