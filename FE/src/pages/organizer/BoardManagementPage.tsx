import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useBoardManagement } from "../../hooks/useBoardManagement";
import { BoardListSection } from "../../components/organizer/board-management/BoardListSection";
import { BoardRoundSection } from "../../components/organizer/board-management/BoardRoundSection";
import { BoardSlotsSection } from "../../components/organizer/board-management/BoardSlotsSection";
import { TeamDetailModal } from "../../components/organizer/TeamDetailModal";
import { useToast } from "../../components/feedback/ToastProvider";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import {
  boardFormSchema,
  randomAssignSchema,
  roundFormSchemaForEvent,
  slotNumberSchema
} from "../../domain/schemas";
import { useBoardSetupProgress } from "../../hooks/useBoardSetupProgress";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { invalidateAfterBoardMutation } from "../../lib/invalidateBoardQueries";
import { queryKeys } from "../../lib/queryKeys";
import type { BoardWithSlots } from "./boardManagementUtils";
import { createIdempotencyKey } from "../../utils/idempotency";
import {
  assignTeamToSlot,
  createBoard,
  createBoardSlot,
  createRound,
  deleteBoard,
  deleteBoardSlot,
  deleteRound,
  moveTeamBetweenSlots,
  randomAssignTeams,
  swapBoardSlots,
  unassignTeamFromSlot,
  updateBoard,
  updateRound,
  type BoardSlotResponse
} from "../../services/contestApi";
import { fetchTeam, type TeamDetailResponse } from "../../services/registrationService";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";
import { zodFirstError } from "../../utils/formValidation";
import { zodFieldErrors } from "../../utils/zodFieldErrors";
import { isRoundRunning, pickActiveRound } from "../../utils/pickActiveRound";
import { handleEmbeddedNextStep, type HubEmbedProps } from "../../utils/hubEmbedUtils";
import { macroPathToWizardStep } from "./eventWizardUtils";
import {
  defaultRoundTimes,
  normalizeBoardStep,
  resolveBoardSetupStep,
  roundNameForKind,
  suggestNextRound,
  toIsoFromLocal,
  toLocalInput,
  type BoardSetupStep
} from "./boardManagementUtils";

export function BoardManagementPage({ embedded = false, onWizardStep }: HubEmbedProps = {}) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const {
    rounds,
    selectedRoundId,
    setSelectedRoundId,
    boards,
    teams,
    loading,
    error,
    slotTeamPick,
    setSlotTeamPick,
    boardEdits,
    setBoardEdits,
    invalidate,
    eventDetail,
    teamMap,
    confirmedTeams,
    assignedTeamIds
  } = useBoardManagement(eventId);
  const [busy, setBusy] = useState(false);
  const [roundFieldErrors, setRoundFieldErrors] = useState<Record<string, string>>({});
  const [createBoardFieldErrors, setCreateBoardFieldErrors] = useState<Record<string, string>>({});
  const [boardFieldErrors, setBoardFieldErrors] = useState<Record<number, Record<string, string>>>({});

  const [roundType, setRoundType] = useState<"GROUP_STAGE" | "FINAL">("GROUP_STAGE");
  const [roundOrder, setRoundOrder] = useState(1);
  const [roundStartAt, setRoundStartAt] = useState("");
  const [roundEndAt, setRoundEndAt] = useState("");

  const [boardName, setBoardName] = useState("");
  const [boardOrder, setBoardOrder] = useState(1);
  const [slotTeamNumber, setSlotTeamNumber] = useState<Record<number, string>>({});
  const [moveFromId, setMoveFromId] = useState("");
  const [moveToId, setMoveToId] = useState("");
  const [swapAId, setSwapAId] = useState("");
  const [swapBId, setSwapBId] = useState("");
  const [forceReplace, setForceReplace] = useState(false);
  const [detailTeam, setDetailTeam] = useState<TeamDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailContext, setDetailContext] = useState<string | undefined>();

  const [editRoundType, setEditRoundType] = useState<"GROUP_STAGE" | "FINAL">("GROUP_STAGE");
  const [editRoundOrder, setEditRoundOrder] = useState(1);
  const [editRoundStartAt, setEditRoundStartAt] = useState("");
  const [editRoundEndAt, setEditRoundEndAt] = useState("");
  const [showAddRound, setShowAddRound] = useState(false);

  const teamById = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.id, team])),
    [teams]
  );

  function teamsForSlot(slotId: number, currentTeamId: number | null) {
    return confirmedTeams.filter(
      (team) => team.id === currentTeamId || !assignedTeamIds.has(team.id)
    );
  }

  function slotPickValue(slot: BoardSlotResponse) {
    const picked = slotTeamPick[slot.id];
    if (picked !== undefined && picked !== "") return picked;
    return slot.teamId ? String(slot.teamId) : "";
  }

  const allSlots = useMemo(
    () =>
      boards.flatMap(({ board, slots }) =>
        slots.map((slot) => ({
          slot,
          label: `${board.name} — vị trí #${slot.teamNumber}`
        }))
      ),
    [boards]
  );

  const { microSteps, stats } = useBoardSetupProgress(rounds.length, boards);
  const [activeStep, setActiveStep] = useState<BoardSetupStep | null>(null);
  const currentStep = activeStep ?? resolveBoardSetupStep(microSteps);

  function goToStep(anchor: string) {
    setActiveStep(normalizeBoardStep(anchor));
  }

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId) ?? null,
    [rounds, selectedRoundId]
  );

  const activeRound = useMemo(() => pickActiveRound(rounds), [rounds]);

  useEffect(() => {
    if (!selectedRound) return;
    setEditRoundType(selectedRound.roundType as "GROUP_STAGE" | "FINAL");
    setEditRoundOrder(selectedRound.roundOrder);
    setEditRoundStartAt(toLocalInput(selectedRound.startAt));
    setEditRoundEndAt(toLocalInput(selectedRound.endAt));
  }, [selectedRound]);

  useEffect(() => {
    if (!eventDetail) return;
    const defaults = defaultRoundTimes(eventDetail.startDate ?? "", eventDetail.endDate ?? "");
    setRoundStartAt(defaults.start);
    setRoundEndAt(defaults.end);
  }, [eventId, eventDetail]);

  useEffect(() => {
    setBoardOrder(boards.length + 1);
  }, [boards.length, selectedRoundId]);

  const roundTimelineBounds = useMemo(
    () =>
      rounds.map((round) => ({
        id: round.id,
        startAt: toLocalInput(round.startAt),
        endAt: toLocalInput(round.endAt)
      })),
    [rounds]
  );

  const roundSchema = useMemo(
    () =>
      roundFormSchemaForEvent(
        eventDetail?.startDate,
        eventDetail?.endDate,
        roundTimelineBounds,
        selectedRoundId ?? undefined
      ),
    [eventDetail?.startDate, eventDetail?.endDate, roundTimelineBounds, selectedRoundId]
  );

  async function handleCreateRound() {
    if (!eventId) return;
    const name = roundNameForKind(roundType, roundOrder);
    const parsed = roundSchema.safeParse({
      name,
      roundOrder,
      startAt: roundStartAt,
      endAt: roundEndAt
    });
    if (!parsed.success) {
      setRoundFieldErrors(zodFieldErrors(parsed.error));
      notify(zodFirstError(parsed.error), "warning");
      return;
    }
    setRoundFieldErrors({});
    setBusy(true);
    try {
      const created = await createRound(eventId, {
        name: name.trim(),
        roundType,
        roundOrder,
        startAt: toIsoFromLocal(parsed.data.startAt),
        endAt: toIsoFromLocal(parsed.data.endAt)
      });
      setSelectedRoundId(created.id);
      setShowAddRound(false);
      await invalidate(created.id);
      notify("Đã tạo vòng thi. Tiếp theo: thêm bảng bên dưới.", "success");
      goToStep("#board-step-layout");
    } catch (err) {
      applyApiFormErrors(err, setRoundFieldErrors);
      notify(resolveApiError(err, "Tạo vòng thi thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  function openAddRoundForm() {
    const next = suggestNextRound(rounds);
    setRoundType(next.roundType);
    setRoundOrder(next.roundOrder);
    setRoundStartAt(next.startAt);
    setRoundEndAt(next.endAt);
    setShowAddRound(true);
    goToStep("#board-step-round");
  }

  async function handleCreateBoard() {
    if (!selectedRoundId) {
      notify("Chọn vòng trước khi thêm bảng.", "warning");
      return;
    }
    const parsed = boardFormSchema.safeParse({ name: boardName, boardOrder });
    if (!parsed.success) {
      setCreateBoardFieldErrors(zodFieldErrors(parsed.error));
      notify(zodFirstError(parsed.error), "warning");
      return;
    }
    setCreateBoardFieldErrors({});
    setBusy(true);
    try {
      await createBoard(selectedRoundId, {
        name: parsed.data.name,
        boardOrder: parsed.data.boardOrder
      });
      setBoardName("");
      await invalidate();
      notify("Đã tạo bảng thi. Tiếp theo: thêm vị trí trên bảng vừa tạo.", "success");
      goToStep("#board-step-layout");
    } catch (err) {
      applyApiFormErrors(err, setCreateBoardFieldErrors);
      notify(resolveApiError(err, "Tạo bảng thi thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateSlot(boardId: number) {
    const raw = slotTeamNumber[boardId] ?? "";
    const teamNumber = Number(raw);
    const parsed = slotNumberSchema.safeParse(teamNumber);
    if (!selectedRoundId || !parsed.success) {
      notify(parsed.success ? "Nhập số vị trí hợp lệ." : zodFirstError(parsed.error), "warning");
      return;
    }
    setBusy(true);
    try {
      await createBoardSlot(boardId, teamNumber);
      setSlotTeamNumber((current) => ({ ...current, [boardId]: "" }));
      await invalidate();
      notify("Đã thêm vị trí — chọn đội ngay bên dưới hoặc dùng phân công ngẫu nhiên.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Thêm vị trí thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnassignSlot(slotId: number) {
    if (!selectedRoundId) return;
    setBusy(true);
    try {
      await unassignTeamFromSlot(selectedRoundId, slotId);
      await invalidate();
      await invalidateAfterBoardMutation(queryClient);
      setSlotTeamPick((current) => ({ ...current, [slotId]: "" }));
      notify("Đã gỡ đội khỏi vị trí.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gỡ đội thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSlot(slotId: number) {
    if (!selectedRoundId) return;
    setBusy(true);
    try {
      await deleteBoardSlot(slotId);
      await invalidate();
      notify("Đã xóa vị trí trống.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Không xóa được vị trí."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteBoard(boardId: number) {
    if (!window.confirm("Xóa bảng này? Cần gỡ hết đội và chưa công bố kết quả bảng.")) return;
    setBusy(true);
    try {
      await deleteBoard(boardId);
      await invalidate();
      await invalidateAfterBoardMutation(queryClient);
      notify("Đã xóa bảng.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Không xóa được bảng."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteRound() {
    if (!selectedRoundId) return;
    if (!window.confirm("Xóa vòng đang chọn? Cần gỡ hết đội và chưa công bố kết quả vòng.")) return;
    const deletedRoundId = selectedRoundId;
    setBusy(true);
    try {
      await deleteRound(deletedRoundId);
      const remaining = rounds.filter((round) => round.id !== deletedRoundId);
      setSelectedRoundId(remaining[0]?.id ?? null);
      await invalidate();
      await invalidateAfterBoardMutation(queryClient);
      notify("Đã xóa vòng.", "success");
      if (remaining.length === 0) {
        goToStep("#board-step-round");
      }
    } catch (err) {
      notify(resolveApiError(err, "Không xóa được vòng."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function openTeamDetail(teamId: number, contextLabel?: string) {
    setDetailLoading(true);
    setDetailTeam(null);
    setDetailContext(contextLabel);
    try {
      const team = await fetchTeam(teamId);
      setDetailTeam(team);
    } catch (err) {
      notify(resolveApiError(err, "Không tải được chi tiết đội."), "danger");
      setDetailContext(undefined);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeTeamDetail() {
    setDetailTeam(null);
    setDetailContext(undefined);
    setDetailLoading(false);
  }

  async function handleAssignSlot(slotId: number, slotOccupied: boolean) {
    if (!selectedRoundId) return;
    const slot = boards.flatMap(({ slots }) => slots).find((item) => item.id === slotId);
    const teamId = Number(slot ? slotPickValue(slot) : slotTeamPick[slotId] ?? "");
    if (!teamId) {
      notify("Chọn đội để gán vào vị trí.", "warning");
      return;
    }
    if (slotOccupied && !forceReplace) {
      notify("Vị trí đã có đội — bật «Ghi đè» hoặc chọn vị trí trống.", "warning");
      return;
    }
    const boardKey = queryKeys.boards.roundDetail(eventId, selectedRoundId);
    const previousBoards = queryClient.getQueryData<BoardWithSlots[]>(boardKey);
    if (previousBoards) {
      queryClient.setQueryData<BoardWithSlots[]>(
        boardKey,
        previousBoards.map((entry) => ({
          ...entry,
          slots: entry.slots.map((s) => (s.id === slotId ? { ...s, teamId } : s))
        }))
      );
    }
    setSlotTeamPick((current) => ({ ...current, [slotId]: String(teamId) }));

    setBusy(true);
    try {
      await assignTeamToSlot(
        selectedRoundId,
        slotId,
        teamId,
        slotOccupied && forceReplace,
        createIdempotencyKey(`assign-slot-${slotId}`)
      );
      await invalidate();
      await invalidateAfterBoardMutation(queryClient);
      notify(slotOccupied ? "Đã ghi đè đội trong vị trí." : "Đã gán đội vào vị trí.", "success");
    } catch (err) {
      if (previousBoards) {
        queryClient.setQueryData(boardKey, previousBoards);
      }
      setSlotTeamPick((current) => ({ ...current, [slotId]: slot?.teamId ? String(slot.teamId) : "" }));
      notify(resolveApiError(err, "Gán đội thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveRound() {
    if (!selectedRoundId) return;
    const editRoundName = roundNameForKind(editRoundType, editRoundOrder);
    const parsed = roundSchema.safeParse({
      name: editRoundName,
      roundOrder: editRoundOrder,
      startAt: editRoundStartAt,
      endAt: editRoundEndAt
    });
    if (!parsed.success) {
      setRoundFieldErrors(zodFieldErrors(parsed.error));
      notify(zodFirstError(parsed.error), "warning");
      return;
    }
    setRoundFieldErrors({});
    setBusy(true);
    try {
      await updateRound(selectedRoundId, {
        name: editRoundName,
        roundType: editRoundType,
        roundOrder: parsed.data.roundOrder,
        startAt: toIsoFromLocal(parsed.data.startAt),
        endAt: toIsoFromLocal(parsed.data.endAt)
      });
      await invalidate();
      notify("Đã lưu vòng thi.", "success");
      if (boards.length === 0) goToStep("#board-step-layout");
    } catch (err) {
      applyApiFormErrors(err, setRoundFieldErrors);
      notify(resolveApiError(err, "Cập nhật vòng thi thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveBoard(boardId: number) {
    const edit = boardEdits[boardId];
    if (!selectedRoundId || !edit) return;
    const parsed = boardFormSchema.safeParse({
      name: edit.name,
      boardOrder: edit.boardOrder,
      description: edit.description
    });
    if (!parsed.success) {
      setBoardFieldErrors((prev) => ({
        ...prev,
        [boardId]: zodFieldErrors(parsed.error)
      }));
      notify(zodFirstError(parsed.error), "warning");
      return;
    }
    setBoardFieldErrors((prev) => {
      const next = { ...prev };
      delete next[boardId];
      return next;
    });
    setBusy(true);
    try {
      await updateBoard(boardId, {
        name: parsed.data.name,
        boardOrder: parsed.data.boardOrder,
        description: edit.description.trim() || undefined
      });
      await invalidate();
      notify("Đã lưu bảng thi.", "success");
    } catch (err) {
      applyApiFormErrors(err, (errors) => {
        setBoardFieldErrors((prev) => ({ ...prev, [boardId]: errors }));
      });
      notify(resolveApiError(err, "Cập nhật bảng thi thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleRandomAssign() {
    if (!selectedRoundId) return;
    const emptySlots = boards.flatMap(({ slots }) => slots).filter((slot) => !slot.teamId).length;
    const unassignedCount = confirmedTeams.filter((team) => !assignedTeamIds.has(team.id)).length;
    if (emptySlots === 0) {
      notify("Không còn vị trí trống trong vòng này.", "warning");
      return;
    }
    if (unassignedCount === 0) {
      notify("Không còn đội đã xác nhận chưa được gán vị trí.", "warning");
      return;
    }
    const parsed = randomAssignSchema.safeParse({});
    if (!parsed.success) {
      notify(zodFirstError(parsed.error), "warning");
      return;
    }
    setBusy(true);
    try {
      const result = await randomAssignTeams(selectedRoundId, parsed.data);
      await invalidate();
      await invalidateAfterBoardMutation(queryClient);
      const count = result?.assignedCount ?? 0;
      if (count === 0) {
        notify(
          "Không gán thêm đội nào — kiểm tra: có đội đã xác nhận chưa gán vị trí và còn vị trí trống.",
          "warning"
        );
      } else {
        notify(
          `Đã phân công ${count} đội. Bạn có thể sang Cấu hình đề thi (nút ở panel phía trên).`,
          "success"
        );
      }
    } catch (err) {
      notify(resolveApiError(err, "Phân công ngẫu nhiên thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleMove() {
    if (!selectedRoundId || !moveFromId || !moveToId) {
      notify("Chọn vị trí nguồn và vị trí đích.", "warning");
      return;
    }
    if (moveFromId === moveToId) {
      notify("Vị trí nguồn và đích phải khác nhau.", "warning");
      return;
    }
    setBusy(true);
    try {
      await moveTeamBetweenSlots(
        selectedRoundId,
        Number(moveFromId),
        Number(moveToId),
        createIdempotencyKey(`move-${moveFromId}-${moveToId}`)
      );
      await invalidate();
      notify("Đã di chuyển đội giữa các vị trí.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Di chuyển thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleSwap() {
    if (!selectedRoundId || !swapAId || !swapBId) {
      notify("Chọn hai vị trí để hoán đổi.", "warning");
      return;
    }
    if (swapAId === swapBId) {
      notify("Hai vị trí hoán đổi phải khác nhau.", "warning");
      return;
    }
    setBusy(true);
    try {
      await swapBoardSlots(
        selectedRoundId,
        Number(swapAId),
        Number(swapBId),
        createIdempotencyKey(`swap-${swapAId}-${swapBId}`)
      );
      await invalidate();
      notify("Đã hoán đổi hai vị trí.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Hoán đổi thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  if (eventLoading || loading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <PageHeader
          eyebrow="Bảng thi và phân công"
          title="Quản lý bảng thi"
          description="Vòng → bảng & vị trí — gán đội tại Vận hành bảng khi đã có đội."
          actions={
            <>
              <ButtonLink to="/organizer/events/basic-info" variant="ghost" icon={<Icon name="settings" />}>
                Thiết lập cuộc thi
              </ButtonLink>
              <OrganizerContextBar />
              {rounds.length > 0 ? (
                <select
                  value={selectedRoundId ?? ""}
                  onChange={(event) => setSelectedRoundId(Number(event.target.value))}
                  className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-label-md"
                >
                  {rounds.map((round) => (
                    <option key={round.id} value={round.id}>
                      {round.name}
                      {activeRound?.id === round.id && isRoundRunning(round) ? " · đang diễn ra" : ""}
                      {activeRound?.id === round.id && !isRoundRunning(round) ? " · vòng hiện tại" : ""}
                    </option>
                  ))}
                </select>
              ) : null}
            </>
          }
        />
      ) : (
        <section className="flex flex-wrap items-end gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
          {rounds.length > 0 ? (
            <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
              Vòng thi
              <select
                value={selectedRoundId ?? ""}
                onChange={(event) => setSelectedRoundId(Number(event.target.value))}
                className="min-w-[12rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
              >
                {rounds.map((round) => (
                  <option key={round.id} value={round.id}>
                    {round.name}
                    {activeRound?.id === round.id && isRoundRunning(round) ? " · đang diễn ra" : ""}
                    {activeRound?.id === round.id && !isRoundRunning(round) ? " · vòng hiện tại" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </section>
      )}

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
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

      {currentStep === "#board-step-round" ? (
        <BoardRoundSection
          rounds={rounds}
          activeRound={activeRound}
          selectedRoundId={selectedRoundId}
          busy={busy}
          showAddRound={showAddRound}
          roundType={roundType}
          roundOrder={roundOrder}
          roundStartAt={roundStartAt}
          roundEndAt={roundEndAt}
          editRoundType={editRoundType}
          editRoundOrder={editRoundOrder}
          editRoundStartAt={editRoundStartAt}
          editRoundEndAt={editRoundEndAt}
          onRoundTypeChange={setRoundType}
          onRoundOrderChange={setRoundOrder}
          onRoundStartAtChange={setRoundStartAt}
          onRoundEndAtChange={setRoundEndAt}
          onEditRoundTypeChange={setEditRoundType}
          onEditRoundOrderChange={setEditRoundOrder}
          onEditRoundStartAtChange={setEditRoundStartAt}
          onEditRoundEndAtChange={setEditRoundEndAt}
          fieldErrors={roundFieldErrors}
          onOpenAddRoundForm={openAddRoundForm}
          onCreateRound={() => void handleCreateRound()}
          onCancelAddRound={() => setShowAddRound(false)}
          onSaveRound={() => void handleSaveRound()}
          onDeleteRound={() => void handleDeleteRound()}
        />
      ) : null}

      {currentStep === "#board-step-layout" ? (
        rounds.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <p className="font-body-md text-on-surface-variant">Hoàn thành bước «Vòng thi» trước khi thêm bảng.</p>
          </div>
        ) : (
          <div className="space-y-lg">
            <BoardListSection
              selectedRound={selectedRound}
              boards={boards}
              boardEdits={boardEdits}
              boardName={boardName}
              boardOrder={boardOrder}
              createBoardFieldErrors={createBoardFieldErrors}
              boardFieldErrors={boardFieldErrors}
              busy={busy}
              selectedRoundId={selectedRoundId}
              onBoardNameChange={(value) => {
                setBoardName(value);
                setCreateBoardFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              onBoardOrderChange={(value) => {
                setBoardOrder(value);
                setCreateBoardFieldErrors((prev) => ({ ...prev, boardOrder: "" }));
              }}
              onBoardEditsChange={setBoardEdits}
              onCreateBoard={() => void handleCreateBoard()}
              onSaveBoard={(boardId) => void handleSaveBoard(boardId)}
              onDeleteBoard={(boardId) => void handleDeleteBoard(boardId)}
              onClearBoardFieldError={(boardId, field) => {
                setBoardFieldErrors((prev) => {
                  const current = prev[boardId];
                  if (!current?.[field]) return prev;
                  const nextBoard = { ...current, [field]: "" };
                  return { ...prev, [boardId]: nextBoard };
                });
              }}
            />
            <BoardSlotsSection
              boards={boards}
              teams={teams}
              confirmedTeams={confirmedTeams}
              teamMap={teamMap}
              teamById={teamById}
              allSlots={allSlots}
              stats={stats}
              busy={busy}
              selectedRoundId={selectedRoundId}
              forceReplace={forceReplace}
              slotTeamNumber={slotTeamNumber}
              moveFromId={moveFromId}
              moveToId={moveToId}
              swapAId={swapAId}
              swapBId={swapBId}
              onForceReplaceChange={setForceReplace}
              onSlotTeamNumberChange={(boardId, value) =>
                setSlotTeamNumber((current) => ({ ...current, [boardId]: value }))
              }
              onSlotTeamPickChange={(slotId, value) =>
                setSlotTeamPick((current) => ({ ...current, [slotId]: value }))
              }
              onMoveFromIdChange={setMoveFromId}
              onMoveToIdChange={setMoveToId}
              onSwapAIdChange={setSwapAId}
              onSwapBIdChange={setSwapBId}
              slotPickValue={slotPickValue}
              teamsForSlot={teamsForSlot}
              onRandomAssign={() => void handleRandomAssign()}
              onMove={() => void handleMove()}
              onSwap={() => void handleSwap()}
              onCreateSlot={(boardId) => void handleCreateSlot(boardId)}
              onAssignSlot={(slotId, occupied) => void handleAssignSlot(slotId, occupied)}
              onUnassignSlot={(slotId) => void handleUnassignSlot(slotId)}
              onDeleteSlot={(slotId) => void handleDeleteSlot(slotId)}
              onOpenTeamDetail={(teamId, contextLabel) => void openTeamDetail(teamId, contextLabel)}
              showAssignment={false}
            />
          </div>
        )
      ) : null}

      <TeamDetailModal
        open={detailLoading || detailTeam !== null}
        loading={detailLoading}
        team={detailTeam}
        contextLabel={detailContext}
        onClose={closeTeamDetail}
      />

    </div>
  );
}
