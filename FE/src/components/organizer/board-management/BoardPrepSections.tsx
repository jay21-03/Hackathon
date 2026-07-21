import { useEffect, useMemo, useState } from "react";
import { BoardProblemSection } from "../board-operations/BoardProblemSection";
import { BoardStaffSection } from "../board-operations/BoardStaffSection";
import { ProblemRepoTemplateSection } from "../ProblemRepoTemplateSection";
import { useToast } from "../../feedback/ToastProvider";
import { enableGithubProvisioning } from "../../../config/features";
import { problemFormSchemaForRound } from "../../../domain/schemas";
import { useActiveTerm } from "../../../hooks/useActiveTerm";
import { useBoardOperations } from "../../../hooks/useBoardOperations";
import {
  assignJudge,
  assignMentor,
  removeJudge,
  removeMentor
} from "../../../services/assignmentService";
import { createProblem, deleteProblem, updateProblem } from "../../../services/contestApi";
import { applyApiFormErrors, resolveApiError } from "../../../utils/apiError";
import { createIdempotencyKey } from "../../../utils/idempotency";
import { zodFirstError } from "../../../utils/formValidation";
import { zodFieldErrors } from "../../../utils/zodFieldErrors";
import { toIsoFromLocal, toLocalInput } from "../../../pages/organizer/boardOperationsUtils";
import type { EventDetail } from "../../../services/eventsApi";

interface BoardPrepSectionsProps {
  eventId: number;
  event: Pick<EventDetail, "academicTermId" | "academicTermName" | "academicTermCode"> | null;
  step: "#board-step-staff" | "#board-step-problem";
  boardsCount: number;
  onProblemSaved?: () => void;
}

export function BoardPrepSections({
  eventId,
  event,
  step,
  boardsCount,
  onProblemSaved
}: BoardPrepSectionsProps) {
  const { notify } = useToast();
  const { termId: activeTermId, term: activeTerm } = useActiveTerm();
  const staffTermId = event?.academicTermId ?? activeTermId;
  const staffTermLabel =
    event?.academicTermName ?? event?.academicTermCode ?? activeTerm?.name ?? activeTerm?.code ?? null;

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
    userNameById,
    staffPoolTermScoped,
    loading,
    error,
    invalidate,
    invalidateAssignments
  } = useBoardOperations(eventId, { academicTermId: staffTermId });

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
  const [mentorPickError, setMentorPickError] = useState<string | null>(null);
  const [judgePickError, setJudgePickError] = useState<string | null>(null);
  const [problemFieldErrors, setProblemFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTitle(problem?.title ?? "");
    setDescription(problem?.description ?? "");
    setExternalLink(problem?.externalLink ?? "");
    setAttachmentUrl(problem?.attachmentUrl ?? null);
    setAttachmentFileName(
      problem?.attachmentUrl ? problem.attachmentUrl.split("/").pop() ?? null : null
    );
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

  const userNameByIdLegacy = useMemo(
    () => Object.fromEntries([...mentors, ...judges].map((user) => [user.id, user.fullName])),
    [judges, mentors]
  );
  const resolvedUserNameById = Object.keys(userNameById).length ? userNameById : userNameByIdLegacy;

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
      onProblemSaved?.();
      notify(problem ? "Đã cập nhật đề thi." : "Đã tạo đề thi.", "success");
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
      onProblemSaved?.();
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
      setMentorPickError("Chọn mentor trước khi gán.");
      notify("Chọn mentor.", "warning");
      return;
    }
    setMentorPickError(null);
    setStaffBusy(true);
    try {
      await assignMentor(boardId, userId);
      await invalidateAssignments();
      setMentorPick("");
      notify("Đã gán mentor.", "success");
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
      setJudgePickError("Chọn giám khảo trước khi gán.");
      notify("Chọn giám khảo.", "warning");
      return;
    }
    setJudgePickError(null);
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

  async function handleRemoveMentor(assigneeId: number) {
    if (!boardId) return;
    setStaffBusy(true);
    try {
      await removeMentor(boardId, assigneeId);
      await invalidateAssignments();
      notify("Đã xóa mentor.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Xóa mentor thất bại."), "danger");
    } finally {
      setStaffBusy(false);
    }
  }

  async function handleRemoveJudge(assigneeId: number) {
    if (!boardId) return;
    setStaffBusy(true);
    try {
      await removeJudge(boardId, assigneeId);
      await invalidateAssignments();
      notify("Đã xóa giám khảo.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Xóa giám khảo thất bại."), "danger");
    } finally {
      setStaffBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container p-lg font-body-sm text-on-surface-variant">
        Đang tải…
      </div>
    );
  }

  if (boardsCount === 0) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <p className="font-body-md text-on-surface-variant">
          Hoàn thành bước «Bảng & vị trí» trước khi phân công staff hoặc tạo đề.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
        <p className="font-body-sm text-on-surface">{error}</p>
      </div>
    );
  }

  if (step === "#board-step-staff") {
    return (
      <div className="space-y-lg">
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
          userNameById={resolvedUserNameById}
          staffPoolScope={staffPoolTermScoped ? staffTermLabel : null}
          pickValue={mentorPick}
          pickError={mentorPickError}
          busy={staffBusy}
          onRoundChange={setSelectedRoundId}
          onBoardChange={setBoardId}
          onPickChange={(value) => {
            setMentorPick(value);
            setMentorPickError(null);
          }}
          onAssign={() => void handleAssignMentor()}
          onRemove={(id) => void handleRemoveMentor(id)}
        />
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
          userNameById={resolvedUserNameById}
          blockedAssigneeIds={boardMentors.map((row) => row.assigneeId)}
          blockedAssigneeReason="đang là mentor bảng này"
          staffPoolScope={staffPoolTermScoped ? staffTermLabel : null}
          pickValue={judgePick}
          pickError={judgePickError}
          busy={staffBusy}
          onRoundChange={setSelectedRoundId}
          onBoardChange={setBoardId}
          onPickChange={(value) => {
            setJudgePick(value);
            setJudgePickError(null);
          }}
          onAssign={() => void handleAssignJudge()}
          onRemove={(id) => void handleRemoveJudge(id)}
        />
      </div>
    );
  }

  if (boardMentors.length === 0 || boardJudges.length === 0) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <p className="font-body-md text-on-surface-variant">
          Hoàn thành bước «Mentor & giám khảo» trước khi cấu hình đề thi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-md">
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

      {enableGithubProvisioning && problem ? (
        <ProblemRepoTemplateSection problemId={problem.id} problemTitle={problem.title} />
      ) : null}
    </div>
  );
}
