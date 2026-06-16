import { useEffect, useMemo, useState } from "react";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { StaffCarryoverSection } from "../../components/organizer/staff-management/StaffCarryoverSection";
import { enableAcademicTerms, enableStaffInvitations } from "../../config/features";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useStaffManagementProgress } from "../../hooks/useStaffManagementProgress";
import { useInvitationManagement } from "../../hooks/useInvitationManagement";
import { handleEmbeddedNextStep, type HubEmbedProps } from "../../utils/hubEmbedUtils";
import { macroPathToWizardStep } from "./eventWizardUtils";
import { InvitationManagementPage } from "./InvitationManagementPage";
import {
  normalizeStaffManagementStep,
  resolveStaffManagementStep,
  type StaffManagementStep
} from "./staffManagementUtils";

export function StaffManagementPage({ embedded = false, onWizardStep }: HubEmbedProps = {}) {
  const { eventId, event, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const showCarryover = enableAcademicTerms && enableStaffInvitations;
  const [carryoverApplied, setCarryoverApplied] = useState(false);

  const { staffTotal, staffLoading } = useInvitationManagement(eventId, {
    staffEnabled: enableStaffInvitations,
    staffStatus: "",
    staffPage: 0,
    staffSize: 1
  });

  const invitationCount = staffTotal;

  const { microSteps } = useStaffManagementProgress({
    showCarryover,
    carryoverApplied,
    invitationCount
  });

  const [activeStep, setActiveStep] = useState<StaffManagementStep | null>(null);
  const currentStep = activeStep ?? resolveStaffManagementStep(microSteps, showCarryover);

  function goToStep(anchor: string) {
    const step = normalizeStaffManagementStep(anchor);
    setActiveStep(step);
    if (!embedded) {
      window.history.replaceState(null, "", `/organizer/staff${step}`);
    }
  }

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) setActiveStep(normalizeStaffManagementStep(hash));
  }, []);

  if (!enableStaffInvitations) {
    return null;
  }

  if (eventLoading || staffLoading) {
    return <ModuleSkeleton rows={5} variant="table" />;
  }

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <PageHeader
          eyebrow="Thiết lập"
          title="Quản lý giám khảo & mentor"
          description="Chuyển staff nội bộ từ kỳ cũ (không email), mời người mới qua email nếu cần — rồi gán trên bảng thi."
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

      {showCarryover && currentStep === "#staff-step-carryover" && eventId ? (
        <StaffCarryoverSection
          eventId={eventId}
          currentTermId={event?.academicTermId}
          currentTermLabel={
            event?.academicTermName
              ? `${event.academicTermName}${event.academicTermCode ? ` (${event.academicTermCode})` : ""}`
              : null
          }
          onApplied={() => setCarryoverApplied(true)}
        />
      ) : null}

      {currentStep === "#staff-step-invitations" ? (
        <InvitationManagementPage embedded forcedTab="staff" />
      ) : null}
    </div>
  );
}
