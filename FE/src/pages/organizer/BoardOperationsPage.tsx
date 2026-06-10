import { useEffect, useMemo, useState } from "react";
import { BoardProblemSection } from "../../components/organizer/board-operations/BoardProblemSection";
import { BoardStaffSection } from "../../components/organizer/board-operations/BoardStaffSection";
import { useToast } from "../../components/feedback/ToastProvider";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { problemFormSchemaForRound } from "../../domain/schemas";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useBoardOperations } from "../../hooks/useBoardOperations";
import { useBoardOperationsProgress } from "../../hooks/useBoardOperationsProgress";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import {
  assignJudge,
  assignMentor,
  removeJudge,
  removeMentor
} from "../../services/assignmentService";
import { createProblem, deleteProblem, updateProblem } from "../../services/contestApi";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";
import { createIdempotencyKey } from "../../utils/idempotency";
import { zodFirstError } from "../../utils/formValidation";
import { zodFieldErrors } from "../../utils/zodFieldErrors";
import { type HubEmbedProps } from "../../utils/hubEmbedUtils";
import {
  normalizeBoardOpsStep,
  resolveBoardOpsStep,
  toIsoFromLocal,
  toLocalInput,
  type BoardOpsStep
} from "./boardOperationsUtils";

export function BoardOperationsPage({ embedded = false, onWizardStep }: HubEmbedProps = {}) {
  const { notify } = useToast();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { steps: setupSteps } = useEventSetupProgress(
    eventId,
    embedded ? "/organizer/events/wizard" : "/organizer/board-ops"
  );
  const {
    rounds,
    selectedRoundId,
    setSelectedRoundId,
    boards,
    boardId,
    setBoardId,
    problem,
    mentors,
    judges,
    boardMentors,
    boardJudges,
    loading,
    error,
    invalidate,
    invalidateAssignments
  } = useBoardOperations(eventId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentFileName, setAttachmentFileName] = useState<string | null>(null);
  const [releaseAt, setReleaseAt] = useState("");
  const [closeAt, setCloseAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [staffBusy, setStaffBusy] = useState(false);
  const [mentorPick, setMentorPick] = useState("");
  const [judgePick, setJudgePick] = useState("");
  const [problemFieldErrors, setProblemFieldErrors] = useState<Record<string, string>>({});

  const { microSteps } = useBoardOperationsProgress({
    boardsCount: boards.length,
    hasProblem: Boolean(problem),
    mentorCount: boardMentors.length,
    judgeCount: boardJudges.length
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

  useEffect(() => {
    setTitle(problem?.title ?? "");
    setDescription(problem?.description ?? "");
    setExternalLink(problem?.externalLink ?? "");
    setAttachmentUrl(problem?.attachmentUrl ?? null);
    setAttachmentFileName(problem?.attachmentUrl ? problem.attachmentUrl.split("/").pop() ?? null : null);
    setReleaseAt(problem ? toLocalInput(problem.releaseAt) : "");
    setCloseAt(problem?.closeAt ? toLocalInput(problem.closeAt) : "");
  }, [problem]);

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId) ?? null,
    [rounds, selectedRoundId]
  );
  const selectedBoard = useMemo(
    () => boards.find((board) => board.id === boardId) ?? null,
    [boards, boardId]
  );

  const userNameById = useMemo(
    () => Object.fromEntries([...mentors, ...judges].map((user) => [user.id, user.fullName])),
    [judges, mentors]
  );

  async function handleSaveProblem() {
    if (!boardId) return;
    const problemSchema = problemFormSchemaForRound(
      selectedRound?.startAt ? toLocalInput(selectedRound.startAt) : undefined,
      selectedRound?.endAt ? toLocalInput(selectedRound.endAt) : undefined
    );
    const parsed = problemSchema.safeParse({
      title,
      description: description.trim() || undefined,
      releaseAt,
      closeAt,
      externalLink
    });
    if (!parsed.success) {
      setProblemFieldErrors(zodFieldErrors(parsed.error));
      notify(zodFirstError(parsed.error), "warning");
      return;
    }
    setProblemFieldErrors({});
    setSaving(true);
    try {
      const payload = {
        title: parsed.data.title,
        description: description.trim() || undefined,
        externalLink: parsed.data.externalLink?.trim() || undefined,
        attachmentUrl: attachmentUrl ?? null,
        releaseAt: toIsoFromLocal(parsed.data.releaseAt),
        closeAt: toIsoFromLocal(parsed.data.closeAt)
      };
      if (problem) {
        await updateProblem(problem.id, payload);
      } else {
        await createProblem(boardId, payload, createIdempotencyKey(`create-problem-${boardId}`));
      }
      await invalidate();
      notify(
        problem ? "Đã cập nhật đề thi." : "Đã tạo đề thi — tiếp theo: gán mentor.",
        "success"
      );
      if (!problem) goToStep("#ops-step-mentor");
    } catch (err) {
      applyApiFormErrors(err, setProblemFieldErrors);
      notify(resolveApiError(err, "Không lưu được đề thi."), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProblem() {
    if (!problem) return;
    setDeleting(true);
    try {
      await deleteProblem(problem.id);
      await invalidate();
      notify("Đã xóa đề thi.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Không xóa được đề thi."), "danger");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAssignMentor() {
    if (!boardId) return;
    const userId = Number(mentorPick);
    if (!userId) {
      notify("Chọn mentor.", "warning");
      return;
    }
    setStaffBusy(true);
    try {
      await assignMentor(boardId, userId);
      await invalidateAssignments();
      setMentorPick("");
      notify("Đã gán mentor.", "success");
      if (boardJudges.length === 0) goToStep("#ops-step-judge");
    } catch (err) {
      notify(resolveApiError(err, "Gán mentor thất bại."), "danger");
    } finally {
      setStaffBusy(false);
    }
  }

  async function handleAssignJudge() {
    if (!boardId) return;
    const userId = Number(judgePick);
    if (!userId) {
      notify("Chọn giám khảo.", "warning");
      return;
    }
    setStaffBusy(true);
    try {
      await assignJudge(boardId, userId);
      await invalidateAssignments();
      setJudgePick("");
      notify("Đã gán giám khảo.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gán giám khảo thất bại."), "danger");
    } finally {
      setStaffBusy(false);
    }
  }

  async function handleRemoveMentor(mentorId: number) {
    if (!boardId) return;
    setStaffBusy(true);
    try {
      await removeMentor(boardId, mentorId);
      await invalidateAssignments();
      notify("Đã gỡ mentor.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gỡ mentor thất bại."), "danger");
    } finally {
      setStaffBusy(false);
    }
  }

  async function handleRemoveJudge(judgeId: number) {
    if (!boardId) return;
    setStaffBusy(true);
    try {
      await removeJudge(boardId, judgeId);
      await invalidateAssignments();
      notify("Đã gỡ giám khảo.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gỡ giám khảo thất bại."), "danger");
    } finally {
      setStaffBusy(false);
    }
  }

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
          description="Đề thi, mentor và giám khảo theo từng bảng — một luồng liền mạch."
          actions={<OrganizerContextBar />}
        />
      ) : null}

      {!embedded ? (
        <WorkflowSteps
          title="Quy trình thiết lập"
          description="Cùng thứ tự với sidebar — trạng thái tính từ dữ liệu thật."
          steps={setupSteps}
          activeHref="/organizer/board-ops"
        />
      ) : null}

      <WorkflowSteps
        title="Các bước trên trang này"
        description="Chọn một bước — mỗi lần chỉ hiện form của bước đó."
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

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}

      {boards.length === 0 ? (
        <EmptyState
          icon="grid_view"
          title="Chưa có bảng thi"
          description="Tạo vòng, bảng và gán đội trong mục Bảng thi trước."
          action={
            <ButtonLink to="/organizer/boards" icon={null}>
              Đi tới Bảng thi
            </ButtonLink>
          }
        />
      ) : null}

      {boards.length > 0 && currentStep === "#ops-step-problem" ? (
        <BoardProblemSection
          eventId={eventId}
          rounds={rounds}
          boards={boards}
          selectedRoundId={selectedRoundId}
          boardId={boardId}
          problem={problem}
          title={title}
          description={description}
          externalLink={externalLink}
          attachmentUrl={attachmentUrl}
          attachmentFileName={attachmentFileName}
          releaseAt={releaseAt}
          closeAt={closeAt}
          saving={saving}
          deleting={deleting}
          fieldErrors={problemFieldErrors}
          onRoundChange={setSelectedRoundId}
          onBoardChange={setBoardId}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onExternalLinkChange={setExternalLink}
          onReleaseAtChange={setReleaseAt}
          onCloseAtChange={setCloseAt}
          onAttachmentUploaded={(url, fileName) => {
            setAttachmentUrl(url);
            setAttachmentFileName(fileName);
          }}
          onAttachmentClear={() => {
            setAttachmentUrl(null);
            setAttachmentFileName(null);
          }}
          onSave={() => void handleSaveProblem()}
          onDelete={() => void handleDeleteProblem()}
        />
      ) : null}

      {boards.length > 0 && currentStep === "#ops-step-mentor" ? (
        !problem ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <p className="font-body-md text-on-surface-variant">
              Hoàn thành bước «Đề thi» trước khi gán mentor.
            </p>
          </div>
        ) : (
          <BoardStaffSection
            mode="mentor"
            rounds={rounds}
            boards={boards}
            selectedRoundId={selectedRoundId}
            boardId={boardId}
            selectedBoard={selectedBoard}
            selectedRound={selectedRound}
            assigned={boardMentors}
            staffPool={mentors}
            userNameById={userNameById}
            pickValue={mentorPick}
            busy={staffBusy}
            onRoundChange={setSelectedRoundId}
            onBoardChange={setBoardId}
            onPickChange={setMentorPick}
            onAssign={() => void handleAssignMentor()}
            onRemove={(id) => void handleRemoveMentor(id)}
          />
        )
      ) : null}

      {boards.length > 0 && currentStep === "#ops-step-judge" ? (
        !problem ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <p className="font-body-md text-on-surface-variant">
              Hoàn thành bước «Đề thi» trước khi gán giám khảo.
            </p>
          </div>
        ) : (
          <BoardStaffSection
            mode="judge"
            rounds={rounds}
            boards={boards}
            selectedRoundId={selectedRoundId}
            boardId={boardId}
            selectedBoard={selectedBoard}
            selectedRound={selectedRound}
            assigned={boardJudges}
            staffPool={judges}
            userNameById={userNameById}
            pickValue={judgePick}
            busy={staffBusy}
            onRoundChange={setSelectedRoundId}
            onBoardChange={setBoardId}
            onPickChange={setJudgePick}
            onAssign={() => void handleAssignJudge()}
            onRemove={(id) => void handleRemoveJudge(id)}
          />
        )
      ) : null}

    </div>
  );
}
