import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { invalidateAfterBoardMutation } from "../../lib/invalidateBoardQueries";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { NextStepPanel } from "../../components/ui/NextStepPanel";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { boardFormSchema, roundFormSchema, slotNumberSchema } from "../../domain/schemas";
import { getApiErrorMessage } from "../../utils/apiError";
import { zodFirstError } from "../../utils/formValidation";
import { mapOrganizerErrorMessage } from "../../utils/organizerErrors";
import { useBoardSetupProgress } from "../../hooks/useBoardSetupProgress";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { fetchEventDetail } from "../../services/eventsApi";
import {
  assignTeamToSlot,
  createBoard,
  createBoardSlot,
  createRound,
  deleteBoardSlot,
  fetchBoardSlots,
  fetchEventRounds,
  fetchRoundBoards,
  moveTeamBetweenSlots,
  randomAssignTeams,
  swapBoardSlots,
  unassignTeamFromSlot,
  updateBoard,
  updateRound,
  type BoardResponse,
  type BoardSlotResponse,
  type RoundResponse
} from "../../services/contestApi";
import { fetchEventTeams, type TeamDetailResponse } from "../../services/registrationService";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { isRoundRunning, pickActiveRound } from "../../utils/pickActiveRound";

interface BoardWithSlots {
  board: BoardResponse;
  slots: BoardSlotResponse[];
}

function toIsoFromLocal(value: string) {
  return new Date(value).toISOString();
}

function toLocalInput(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function scrollToAnchor(anchor: string) {
  if (typeof document === "undefined") return;
  document.querySelector(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function defaultRoundTimes(startDate: string, endDate: string) {
  const start = startDate ? `${startDate}T08:00` : "";
  const end = endDate ? `${endDate}T17:00` : "";
  return { start, end };
}

function suggestNextRound(rounds: RoundResponse[]) {
  const maxOrder = rounds.reduce((max, round) => Math.max(max, round.roundOrder), 0);
  const nextOrder = maxOrder + 1;
  const lastRound = [...rounds].sort((a, b) => b.roundOrder - a.roundOrder)[0];
  const hasFinal = rounds.some((round) => round.roundType === "FINAL");

  let startAt = "";
  let endAt = "";
  if (lastRound?.endAt) {
    const lastEnd = new Date(lastRound.endAt);
    const nextStart = new Date(lastEnd.getTime() + 60 * 60 * 1000);
    const nextEnd = new Date(lastEnd.getTime() + 24 * 60 * 60 * 1000);
    startAt = toLocalInput(nextStart.toISOString());
    endAt = toLocalInput(nextEnd.toISOString());
  }

  return {
    name: !hasFinal && nextOrder >= 2 ? "Chung kết" : `Vòng ${nextOrder}`,
    roundType: (!hasFinal && nextOrder >= 2 ? "FINAL" : "GROUP_STAGE") as "GROUP_STAGE" | "FINAL",
    roundOrder: nextOrder,
    startAt,
    endAt
  };
}

export function BoardManagementPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const [rounds, setRounds] = useState<RoundResponse[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [boards, setBoards] = useState<BoardWithSlots[]>([]);
  const [teams, setTeams] = useState<TeamDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roundName, setRoundName] = useState("Vòng 1");
  const [roundType, setRoundType] = useState<"GROUP_STAGE" | "FINAL">("GROUP_STAGE");
  const [roundOrder, setRoundOrder] = useState(1);
  const [roundStartAt, setRoundStartAt] = useState("");
  const [roundEndAt, setRoundEndAt] = useState("");

  const [boardName, setBoardName] = useState("");
  const [boardOrder, setBoardOrder] = useState(1);
  const [slotTeamNumber, setSlotTeamNumber] = useState<Record<number, string>>({});
  const [slotTeamPick, setSlotTeamPick] = useState<Record<number, string>>({});
  const [moveFromId, setMoveFromId] = useState("");
  const [moveToId, setMoveToId] = useState("");
  const [swapAId, setSwapAId] = useState("");
  const [swapBId, setSwapBId] = useState("");
  const [forceReplace, setForceReplace] = useState(false);

  const [editRoundName, setEditRoundName] = useState("");
  const [editRoundType, setEditRoundType] = useState<"GROUP_STAGE" | "FINAL">("GROUP_STAGE");
  const [editRoundOrder, setEditRoundOrder] = useState(1);
  const [editRoundStartAt, setEditRoundStartAt] = useState("");
  const [editRoundEndAt, setEditRoundEndAt] = useState("");
  const [boardEdits, setBoardEdits] = useState<
    Record<number, { name: string; boardOrder: number; description: string }>
  >({});
  const [showAddRound, setShowAddRound] = useState(false);

  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.id, team.name])),
    [teams]
  );

  const confirmedTeams = useMemo(
    () => teams.filter((team) => team.status === "CONFIRMED"),
    [teams]
  );

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

  const loadBoardData = useCallback(
    async (roundId: number) => {
      const [boardList, teamList] = await Promise.all([
        fetchRoundBoards(roundId),
        eventId ? fetchEventTeams(eventId) : Promise.resolve([])
      ]);
      const withSlots = await Promise.all(
        boardList.map(async (board) => ({
          board,
          slots: await fetchBoardSlots(board.id)
        }))
      );
      setBoards(withSlots);
      setTeams(teamList);
      setBoardOrder(boardList.length + 1);
      setBoardEdits(
        Object.fromEntries(
          boardList.map((board) => [
            board.id,
            {
              name: board.name,
              boardOrder: board.boardOrder,
              description: board.description ?? ""
            }
          ])
        )
      );
    },
    [eventId]
  );

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId) ?? null,
    [rounds, selectedRoundId]
  );

  const activeRound = useMemo(() => pickActiveRound(rounds), [rounds]);

  useEffect(() => {
    if (!selectedRound) return;
    setEditRoundName(selectedRound.name);
    setEditRoundType(selectedRound.roundType as "GROUP_STAGE" | "FINAL");
    setEditRoundOrder(selectedRound.roundOrder);
    setEditRoundStartAt(toLocalInput(selectedRound.startAt));
    setEditRoundEndAt(toLocalInput(selectedRound.endAt));
  }, [selectedRound]);

  const refreshRounds = useCallback(async () => {
    if (!eventId) return;
    const roundList = await fetchEventRounds(eventId);
    setRounds(roundList);
    const roundId = selectedRoundId && roundList.some((r) => r.id === selectedRoundId)
      ? selectedRoundId
      : (roundList[0]?.id ?? null);
    setSelectedRoundId(roundId);
    if (roundId) await loadBoardData(roundId);
  }, [eventId, loadBoardData, selectedRoundId]);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchEventRounds(eventId), fetchEventDetail(String(eventId))])
      .then(([roundList, eventDetail]) => {
        if (cancelled) return;
        setRounds(roundList);
        const defaults = defaultRoundTimes(eventDetail?.startDate ?? "", eventDetail?.endDate ?? "");
        setRoundStartAt(defaults.start);
        setRoundEndAt(defaults.end);
        const roundId = roundList[0]?.id ?? null;
        setSelectedRoundId(roundId);
        if (roundId) return loadBoardData(roundId);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được thông tin bảng thi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, loadBoardData]);

  useEffect(() => {
    if (!selectedRoundId) return;
    loadBoardData(selectedRoundId).catch(() => setError("Không tải được slot bảng thi."));
  }, [selectedRoundId, loadBoardData]);

  async function handleCreateRound() {
    if (!eventId) return;
    const parsed = roundFormSchema.safeParse({
      name: roundName,
      roundOrder,
      startAt: roundStartAt,
      endAt: roundEndAt
    });
    if (!parsed.success) {
      notify(zodFirstError(parsed.error), "warning");
      return;
    }
    setBusy(true);
    try {
      const created = await createRound(eventId, {
        name: roundName.trim(),
        roundType,
        roundOrder,
        startAt: toIsoFromLocal(roundStartAt),
        endAt: toIsoFromLocal(roundEndAt)
      });
      setSelectedRoundId(created.id);
      setShowAddRound(false);
      await refreshRounds();
      notify("Đã tạo vòng thi. Tiếp theo: thêm bảng bên dưới.", "success");
      scrollToAnchor("#board-step-board");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Tạo vòng thi thất bại.")), "danger");
    } finally {
      setBusy(false);
    }
  }

  function openAddRoundForm() {
    const next = suggestNextRound(rounds);
    setRoundName(next.name);
    setRoundType(next.roundType);
    setRoundOrder(next.roundOrder);
    setRoundStartAt(next.startAt);
    setRoundEndAt(next.endAt);
    setShowAddRound(true);
    scrollToAnchor("#board-step-round");
  }

  async function handleCreateBoard() {
    if (!selectedRoundId) {
      notify("Chọn vòng trước khi thêm bảng.", "warning");
      return;
    }
    const parsed = boardFormSchema.safeParse({ name: boardName, boardOrder });
    if (!parsed.success) {
      notify(zodFirstError(parsed.error), "warning");
      return;
    }
    setBusy(true);
    try {
      await createBoard(selectedRoundId, {
        name: parsed.data.name,
        boardOrder: parsed.data.boardOrder
      });
      setBoardName("");
      await loadBoardData(selectedRoundId);
      notify("Đã tạo bảng thi. Tiếp theo: thêm slot trên bảng vừa tạo.", "success");
      scrollToAnchor("#board-step-slot");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Tạo bảng thi thất bại.")), "danger");
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
      await loadBoardData(selectedRoundId);
      notify("Đã thêm slot. Tiếp theo: gán đội (random hoặc từng slot).", "success");
      scrollToAnchor("#board-step-assign");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Thêm slot thất bại.")), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnassignSlot(slotId: number) {
    if (!selectedRoundId) return;
    setBusy(true);
    try {
      await unassignTeamFromSlot(selectedRoundId, slotId);
      await loadBoardData(selectedRoundId);
      await invalidateAfterBoardMutation(queryClient);
      setSlotTeamPick((current) => ({ ...current, [slotId]: "" }));
      notify("Đã gỡ đội khỏi slot.", "success");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Gỡ đội thất bại.")), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSlot(slotId: number) {
    if (!selectedRoundId) return;
    setBusy(true);
    try {
      await deleteBoardSlot(slotId);
      await loadBoardData(selectedRoundId);
      notify("Đã xóa slot trống.", "success");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Không xóa được slot.")), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleAssignSlot(slotId: number, slotOccupied: boolean) {
    if (!selectedRoundId) return;
    const teamId = Number(slotTeamPick[slotId] ?? "");
    if (!teamId) {
      notify("Chọn đội để gán vào slot.", "warning");
      return;
    }
    if (slotOccupied && !forceReplace) {
      notify("Slot đã có đội — bật «Ghi đè» hoặc chọn slot trống.", "warning");
      return;
    }
    setBusy(true);
    try {
      await assignTeamToSlot(selectedRoundId, slotId, teamId, slotOccupied && forceReplace);
      await loadBoardData(selectedRoundId);
      await invalidateAfterBoardMutation(queryClient);
      notify(slotOccupied ? "Đã ghi đè đội trong slot." : "Đã gán đội vào slot.", "success");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Gán đội thất bại.")), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveRound() {
    if (!selectedRoundId) return;
    const parsed = roundFormSchema.safeParse({
      name: editRoundName,
      roundOrder: editRoundOrder,
      startAt: editRoundStartAt,
      endAt: editRoundEndAt
    });
    if (!parsed.success) {
      notify(zodFirstError(parsed.error), "warning");
      return;
    }
    setBusy(true);
    try {
      await updateRound(selectedRoundId, {
        name: parsed.data.name,
        roundType: editRoundType,
        roundOrder: parsed.data.roundOrder,
        startAt: toIsoFromLocal(parsed.data.startAt),
        endAt: toIsoFromLocal(parsed.data.endAt)
      });
      await refreshRounds();
      notify("Đã lưu vòng thi.", "success");
      if (boards.length === 0) scrollToAnchor("#board-step-board");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Cập nhật vòng thi thất bại.")), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveBoard(boardId: number) {
    const edit = boardEdits[boardId];
    if (!selectedRoundId || !edit) return;
    const parsed = boardFormSchema.safeParse({ name: edit.name, boardOrder: edit.boardOrder });
    if (!parsed.success) {
      notify(zodFirstError(parsed.error), "warning");
      return;
    }
    setBusy(true);
    try {
      await updateBoard(boardId, {
        name: parsed.data.name,
        boardOrder: parsed.data.boardOrder,
        description: edit.description.trim() || undefined
      });
      await loadBoardData(selectedRoundId);
      notify("Đã lưu bảng thi.", "success");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Cập nhật bảng thi thất bại.")), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleRandomAssign() {
    if (!selectedRoundId) return;
    setBusy(true);
    try {
      const result = await randomAssignTeams(selectedRoundId);
      await loadBoardData(selectedRoundId);
      await invalidateAfterBoardMutation(queryClient);
      const count = result?.assignedCount ?? 0;
      if (count === 0) {
        notify(
          "Không gán thêm đội nào — kiểm tra: có đội CONFIRMED chưa gán slot và còn slot trống.",
          "warning"
        );
      } else {
        notify(
          `Đã phân công ${count} đội. Bạn có thể sang Cấu hình đề thi (nút ở panel phía trên).`,
          "success"
        );
      }
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Phân công ngẫu nhiên thất bại.")), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleMove() {
    if (!selectedRoundId || !moveFromId || !moveToId) {
      notify("Chọn slot nguồn và slot đích.", "warning");
      return;
    }
    if (moveFromId === moveToId) {
      notify("Slot nguồn và đích phải khác nhau.", "warning");
      return;
    }
    setBusy(true);
    try {
      await moveTeamBetweenSlots(selectedRoundId, Number(moveFromId), Number(moveToId));
      await loadBoardData(selectedRoundId);
      notify("Đã di chuyển đội giữa các slot.", "success");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Di chuyển thất bại.")), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleSwap() {
    if (!selectedRoundId || !swapAId || !swapBId) {
      notify("Chọn hai slot để hoán đổi.", "warning");
      return;
    }
    if (swapAId === swapBId) {
      notify("Hai slot hoán đổi phải khác nhau.", "warning");
      return;
    }
    setBusy(true);
    try {
      await swapBoardSlots(selectedRoundId, Number(swapAId), Number(swapBId));
      await loadBoardData(selectedRoundId);
      notify("Đã hoán đổi hai slot.", "success");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Hoán đổi thất bại.")), "danger");
    } finally {
      setBusy(false);
    }
  }

  const { microSteps, nextAction, stats } = useBoardSetupProgress(rounds.length, boards);

  const setupComplete = stats.assignedCount > 0;

  if (eventLoading || loading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Bảng thi và phân công"
        title="Quản lý bảng thi"
        description="Làm tuần tự: vòng → bảng → slot → gán đội."
        actions={
          <>
            <ButtonLink to="/organizer/events/basic-info" variant="ghost" icon={<Icon name="settings" />}>
              Thiết lập cuộc thi
            </ButtonLink>
            <EventSelector events={events} eventId={eventId} onChange={setEventId} />
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
            <Button type="button" disabled={!selectedRoundId || busy} onClick={handleRandomAssign}>
              Phân công ngẫu nhiên
            </Button>
          </>
        }
      />

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}

      <NextStepPanel action={nextAction} variant={setupComplete ? "success" : "primary"} />

      <WorkflowSteps
        title="Các bước trên trang này"
        description="Bấm từng ô để nhảy tới phần form tương ứng."
        steps={microSteps.map((step) => ({
          label: step.label,
          detail: step.detail,
          href: step.anchor,
          to: step.to,
          state: step.state
        }))}
      />

      <section
        id="board-step-round"
        className="scroll-mt-24 rounded-xl border border-outline-variant bg-surface-container p-lg space-y-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <h2 className="font-headline-sm text-on-surface">Thiết lập cấu trúc — Vòng thi</h2>
          {rounds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-sm">
              {activeRound ? (
                <Badge tone={isRoundRunning(activeRound) ? "success" : "neutral"}>
                  Vòng hiện tại: {activeRound.name}
                  {isRoundRunning(activeRound) ? " (đang diễn ra)" : ""}
                </Badge>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Icon name="add" />}
                disabled={busy || showAddRound}
                onClick={openAddRoundForm}
              >
                Thêm vòng mới
              </Button>
            </div>
          ) : null}
        </div>
        {rounds.length === 0 || showAddRound ? (
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md space-y-md">
            {showAddRound ? (
              <p className="font-label-md text-on-surface">Tạo vòng mới</p>
            ) : null}
            <div className="grid gap-md md:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                Tên vòng
                <input className="form-input" value={roundName} onChange={(e) => setRoundName(e.target.value)} />
              </label>
              <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                Loại vòng
                <select
                  className="form-input"
                  value={roundType}
                  onChange={(e) => setRoundType(e.target.value as "GROUP_STAGE" | "FINAL")}
                >
                  <option value="GROUP_STAGE">Vòng bảng</option>
                  <option value="FINAL">Chung kết</option>
                </select>
              </label>
              <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                Thứ tự
                <input
                  type="number"
                  min={1}
                  className="form-input"
                  value={roundOrder}
                  onChange={(e) => setRoundOrder(Number(e.target.value))}
                />
              </label>
              <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                Bắt đầu
                <input
                  type="datetime-local"
                  className="form-input"
                  value={roundStartAt}
                  onChange={(e) => setRoundStartAt(e.target.value)}
                />
              </label>
              <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                Kết thúc
                <input
                  type="datetime-local"
                  className="form-input"
                  value={roundEndAt}
                  onChange={(e) => setRoundEndAt(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap items-end gap-sm">
                <Button type="button" disabled={busy} onClick={handleCreateRound}>
                  {showAddRound ? "Tạo vòng" : "Tạo vòng thi"}
                </Button>
                {showAddRound ? (
                  <Button type="button" variant="ghost" disabled={busy} onClick={() => setShowAddRound(false)}>
                    Hủy
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        {rounds.length > 0 ? (
          <div className="space-y-md">
            {selectedRoundId ? (
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md space-y-md">
                <p className="font-label-md text-on-surface">Sửa vòng đang chọn</p>
                <div className="grid gap-md md:grid-cols-2 lg:grid-cols-3">
                  <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                    Tên vòng
                    <input
                      className="form-input"
                      value={editRoundName}
                      onChange={(e) => setEditRoundName(e.target.value)}
                    />
                  </label>
                  <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                    Loại vòng
                    <select
                      className="form-input"
                      value={editRoundType}
                      onChange={(e) => setEditRoundType(e.target.value as "GROUP_STAGE" | "FINAL")}
                    >
                      <option value="GROUP_STAGE">Vòng bảng</option>
                      <option value="FINAL">Chung kết</option>
                    </select>
                  </label>
                  <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                    Thứ tự
                    <input
                      type="number"
                      min={1}
                      className="form-input"
                      value={editRoundOrder}
                      onChange={(e) => setEditRoundOrder(Number(e.target.value))}
                    />
                  </label>
                  <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                    Bắt đầu
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={editRoundStartAt}
                      onChange={(e) => setEditRoundStartAt(e.target.value)}
                    />
                  </label>
                  <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                    Kết thúc
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={editRoundEndAt}
                      onChange={(e) => setEditRoundEndAt(e.target.value)}
                    />
                  </label>
                  <div className="flex items-end">
                    <Button type="button" disabled={busy} onClick={handleSaveRound}>
                      Lưu vòng
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            <div
              id="board-step-board"
              className="scroll-mt-24 flex flex-wrap items-end gap-sm border-t border-outline-variant pt-md"
            >
              <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                Tên bảng mới
                <input
                  className="form-input min-w-[200px]"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="Bảng A"
                />
              </label>
              <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                Thứ tự bảng
                <input
                  type="number"
                  min={1}
                  className="form-input w-24"
                  value={boardOrder}
                  onChange={(e) => setBoardOrder(Number(e.target.value))}
                />
              </label>
              <Button type="button" variant="secondary" disabled={busy || !selectedRoundId} onClick={handleCreateBoard}>
                Thêm bảng
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {rounds.length > 0 ? (
        <label className="inline-flex items-center gap-sm font-body-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={forceReplace}
            onChange={(e) => setForceReplace(e.target.checked)}
            className="h-4 w-4 rounded border-outline-variant"
          />
          Ghi đè khi gán vào slot đã có đội (forceReplace)
        </label>
      ) : null}

      {selectedRoundId && allSlots.length > 0 ? (
        <section
          id="board-step-assign"
          className="scroll-mt-24 rounded-xl border border-outline-variant bg-surface-container p-lg space-y-md"
        >
          <h2 className="font-headline-sm text-on-surface">Gán đội — Di chuyển / hoán đổi slot</h2>
          <div className="flex flex-wrap gap-md items-end">
            <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
              Từ slot
              <select
                className="form-input min-w-[220px]"
                value={moveFromId}
                onChange={(e) => setMoveFromId(e.target.value)}
              >
                <option value="">—</option>
                {allSlots.map(({ slot, label }) => (
                  <option key={slot.id} value={slot.id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
              Đến slot
              <select
                className="form-input min-w-[220px]"
                value={moveToId}
                onChange={(e) => setMoveToId(e.target.value)}
              >
                <option value="">—</option>
                {allSlots.map(({ slot, label }) => (
                  <option key={slot.id} value={slot.id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" variant="secondary" disabled={busy} onClick={handleMove}>
              Di chuyển
            </Button>
          </div>
          <div className="flex flex-wrap gap-md items-end border-t border-outline-variant pt-md">
            <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
              Slot A
              <select className="form-input min-w-[220px]" value={swapAId} onChange={(e) => setSwapAId(e.target.value)}>
                <option value="">—</option>
                {allSlots.map(({ slot, label }) => (
                  <option key={slot.id} value={slot.id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
              Slot B
              <select className="form-input min-w-[220px]" value={swapBId} onChange={(e) => setSwapBId(e.target.value)}>
                <option value="">—</option>
                {allSlots.map(({ slot, label }) => (
                  <option key={slot.id} value={slot.id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" variant="secondary" disabled={busy} onClick={handleSwap}>
              Hoán đổi
            </Button>
          </div>
        </section>
      ) : null}

      {boards.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <p className="font-body-md text-on-surface-variant">
            {rounds.length === 0
              ? "Tạo vòng thi trước, sau đó thêm bảng và slot."
              : "Chưa có bảng cho vòng này — dùng form «Thêm bảng» phía trên."}
          </p>
        </div>
      ) : (
        <section id="board-step-slot" className="scroll-mt-24 grid gap-md lg:grid-cols-2">
          {boards.map(({ board, slots }) => {
            const edit = boardEdits[board.id] ?? {
              name: board.name,
              boardOrder: board.boardOrder,
              description: board.description ?? ""
            };
            return (
          <article key={board.id} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <div className="flex items-start justify-between gap-md">
              <div>
                <h2 className="font-headline-sm text-on-surface">{board.name}</h2>
                  <p className="font-body-sm text-on-surface-variant">Bảng #{board.id}</p>
              </div>
              <Badge tone={getStatusTone(board.status)}>{getStatusLabel(board.status)}</Badge>
            </div>

              <div className="mt-md grid gap-sm sm:grid-cols-2">
                <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant sm:col-span-2">
                  Tên bảng
                  <input
                    className="form-input"
                    value={edit.name}
                    onChange={(e) =>
                      setBoardEdits((current) => ({
                        ...current,
                        [board.id]: { ...edit, name: e.target.value }
                      }))
                    }
                  />
                </label>
                <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                  Thứ tự
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    value={edit.boardOrder}
                    onChange={(e) =>
                      setBoardEdits((current) => ({
                        ...current,
                        [board.id]: { ...edit, boardOrder: Number(e.target.value) }
                      }))
                    }
                  />
                </label>
                <div className="flex items-end">
                  <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => handleSaveBoard(board.id)}>
                    Lưu bảng
                  </Button>
                </div>
                <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant sm:col-span-2">
                  Mô tả
                  <input
                    className="form-input"
                    value={edit.description}
                    onChange={(e) =>
                      setBoardEdits((current) => ({
                        ...current,
                        [board.id]: { ...edit, description: e.target.value }
                      }))
                    }
                  />
                </label>
              </div>

              <div className="mt-md flex flex-wrap gap-sm items-end">
                <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                  Số vị trí slot mới
                  <input
                    type="number"
                    min={1}
                    className="form-input w-28"
                    value={slotTeamNumber[board.id] ?? ""}
                    onChange={(e) =>
                      setSlotTeamNumber((current) => ({ ...current, [board.id]: e.target.value }))
                    }
                  />
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => handleCreateSlot(board.id)}
                >
                  Thêm slot
                </Button>
              </div>

              <div className="mt-md space-y-sm">
                {slots.length === 0 ? (
                  <p className="font-body-sm text-on-surface-variant">Chưa có slot.</p>
                ) : (
                  slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm space-y-sm"
                    >
                      <div className="flex items-center justify-between gap-sm">
                        <span className="font-label-md">Vị trí #{slot.teamNumber}</span>
                        <span className="font-body-sm text-on-surface-variant">
                          {slot.teamId ? teamMap[slot.teamId] ?? `Đội #${slot.teamId}` : "Trống"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-sm items-center">
                        <select
                          className="form-input min-w-[160px] flex-1"
                          value={slotTeamPick[slot.id] ?? ""}
                          onChange={(e) =>
                            setSlotTeamPick((current) => ({ ...current, [slot.id]: e.target.value }))
                          }
                        >
                          <option value="">
                            {slot.teamId ? "Đổi sang đội khác" : "Chọn đội đã duyệt"}
                          </option>
                          {confirmedTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleAssignSlot(slot.id, Boolean(slot.teamId))}
                        >
                          {slot.teamId ? "Ghi đè" : "Gán"}
                        </Button>
                        {slot.teamId ? (
                          <ConfirmAction
                            title="Gỡ đội khỏi slot?"
                            message={`Gỡ «${teamMap[slot.teamId] ?? `Đội #${slot.teamId}`}» khỏi vị trí #${slot.teamNumber}. Đội vẫn trong sự kiện, chỉ không còn trên bảng này.`}
                            confirmLabel="Gỡ đội"
                            onConfirm={() => void handleUnassignSlot(slot.id)}
                          >
                            <Button type="button" size="sm" variant="danger" disabled={busy}>
                              Gỡ đội
                            </Button>
                          </ConfirmAction>
                        ) : (
                          <ConfirmAction
                            title="Xóa slot trống?"
                            message={`Xóa vị trí #${slot.teamNumber} trên bảng «${board.name}». Thao tác không hoàn tác được.`}
                            confirmLabel="Xóa slot"
                            onConfirm={() => void handleDeleteSlot(slot.id)}
                          >
                            <Button type="button" size="sm" variant="ghost" disabled={busy}>
                              Xóa slot
                            </Button>
                          </ConfirmAction>
                        )}
                      </div>
                    </div>
                  ))
                )}
            </div>
          </article>
            );
          })}
      </section>
      )}

      {boards.length > 0 && allSlots.length === 0 ? (
        <p className="font-body-sm text-on-surface-variant">
          Chưa có slot — trên từng bảng, nhập «Số vị trí slot mới» và bấm «Thêm slot».
        </p>
      ) : null}

      <p className="font-body-sm text-on-surface-variant">
        {confirmedTeams.length} đội đã xác nhận (dùng cho gán thủ công). Nếu chưa đủ đội, quay lại{" "}
        <a href="/organizer/registrations" className="text-primary hover:underline">
          Duyệt đăng ký
        </a>
        .
      </p>

      {setupComplete ? (
        <NextStepPanel
          action={{
            title: "Bước tiếp: Đề thi & phân công mentor/GK",
            description: "Sau khi gán đội xong, cấu hình đề và gán mentor/giám khảo theo bảng.",
            to: "/organizer/problems",
            cta: "Đi tới Cấu hình đề thi"
          }}
          variant="success"
        />
      ) : null}
    </div>
  );
}
