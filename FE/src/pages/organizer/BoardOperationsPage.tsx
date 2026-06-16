import { useEffect, useMemo, useState } from "react";
import { BoardTeamAssignmentSection } from "../../components/organizer/board-operations/BoardTeamAssignmentSection";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useBoardManagement } from "../../hooks/useBoardManagement";
import { useBoardOperationsProgress } from "../../hooks/useBoardOperationsProgress";
import { handleEmbeddedNextStep, type HubEmbedProps } from "../../utils/hubEmbedUtils";
import { macroPathToWizardStep } from "./eventWizardUtils";
import {
  normalizeBoardOpsStep,
  resolveBoardOpsStep,
  type BoardOpsStep
} from "./boardOperationsUtils";

export function BoardOperationsPage({ embedded = false, onWizardStep }: HubEmbedProps = {}) {
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const {
    rounds,
    selectedRoundId,
    setSelectedRoundId,
    boards,
    loading,
    error,
    invalidate
  } = useBoardManagement(eventId);

  const slotsCount = useMemo(
    () => boards.reduce((sum, item) => sum + item.slots.length, 0),
    [boards]
  );
  const assignedCount = useMemo(
    () =>
      boards.reduce((sum, item) => sum + item.slots.filter((slot) => slot.teamId).length, 0),
    [boards]
  );

  const { microSteps } = useBoardOperationsProgress({
    boardsCount: boards.length,
    slotsCount,
    assignedCount
  });

  const [activeStep, setActiveStep] = useState<BoardOpsStep | null>(null);
  const currentStep = activeStep ?? resolveBoardOpsStep(microSteps);

  function goToStep(anchor: string) {
    const step = normalizeBoardOpsStep(anchor);
    setActiveStep(step);
    if (!embedded) {
      window.history.replaceState(null, "", `/organizer/board-ops${step}`);
    }
  }

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setActiveStep(normalizeBoardOpsStep(hash));
    }
  }, []);

  if (eventLoading || loading) {
    return <ModuleSkeleton rows={6} />;
  }

  if (!eventId) {
    return (
      <EmptyState
        icon="event"
        title="Chưa có cuộc thi"
        description="Tạo hoặc chọn cuộc thi trước khi vận hành bảng."
      />
    );
  }

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <PageHeader
          eyebrow="Vận hành thi"
          title="Vận hành bảng"
          description="Gán đội đã xác nhận vào vị trí trên bảng — sau khi mở đăng ký và có đội."
          actions={<OrganizerContextBar />}
        />
      ) : null}

      <WorkflowSteps
        title="Các bước trên trang này"
        description="Chọn một bước — mỗi lần chỉ hiện form của bước đó."
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

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}

      {boards.length === 0 ? (
        <EmptyState
          icon="grid_view"
          title="Chưa có bảng thi"
          description="Hoàn thành Quản lý bảng thi (vòng, bảng, staff, đề) trước."
          action={
            <ButtonLink to="/organizer/boards" icon={null}>
              Đi tới Quản lý bảng thi
            </ButtonLink>
          }
        />
      ) : null}

      {boards.length > 0 && currentStep === "#ops-step-teams" && selectedRoundId ? (
        <>
          {rounds.length > 0 ? (
            <section className="flex flex-wrap items-end gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
              <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
                Vòng thi
                <select
                  className="min-w-[12rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                  value={selectedRoundId ?? ""}
                  onChange={(e) => setSelectedRoundId(Number(e.target.value))}
                >
                  {rounds.map((round) => (
                    <option key={round.id} value={round.id}>
                      {round.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          ) : null}
          <BoardTeamAssignmentSection
            eventId={eventId}
            selectedRoundId={selectedRoundId}
            onAssigned={() => void invalidate()}
          />
        </>
      ) : null}
    </div>
  );
}
