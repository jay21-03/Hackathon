import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { fetchEventDetail } from "../../services/eventsApi";
import {
  assignTeamToSlot,
  createBoard,
  createBoardSlot,
  createRound,
  fetchBoardSlots,
  fetchEventRounds,
  fetchRoundBoards,
  moveTeamBetweenSlots,
  randomAssignTeams,
  swapBoardSlots,
  updateBoard,
  updateRound,
  type BoardResponse,
  type BoardSlotResponse,
  type RoundResponse
} from "../../services/contestApi";
import { fetchEventTeams, type TeamDetailResponse } from "../../services/registrationService";
import { getStatusLabel, getStatusTone } from "../../domain/status";

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

function defaultRoundTimes(startDate: string, endDate: string) {
  const start = startDate ? `${startDate}T08:00` : "";
  const end = endDate ? `${endDate}T17:00` : "";
  return { start, end };
}

export function BoardManagementPage() {
  const { notify } = useToast();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent();
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
    if (!eventId || !roundName.trim() || !roundStartAt || !roundEndAt) {
      notify("Nhập đủ tên vòng và thời gian.", "warning");
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
      await refreshRounds();
      notify("Đã tạo vòng thi.", "success");
    } catch {
      notify("Tạo vòng thi thất bại.", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateBoard() {
    if (!selectedRoundId || !boardName.trim()) {
      notify("Chọn vòng và nhập tên bảng.", "warning");
      return;
    }
    setBusy(true);
    try {
      await createBoard(selectedRoundId, {
        name: boardName.trim(),
        boardOrder
      });
      setBoardName("");
      await loadBoardData(selectedRoundId);
      notify("Đã tạo bảng thi.", "success");
    } catch {
      notify("Tạo bảng thi thất bại.", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateSlot(boardId: number) {
    const raw = slotTeamNumber[boardId] ?? "";
    const teamNumber = Number(raw);
    if (!selectedRoundId || !Number.isFinite(teamNumber) || teamNumber < 1) {
      notify("Nhập số vị trí hợp lệ (≥ 1).", "warning");
      return;
    }
    setBusy(true);
    try {
      await createBoardSlot(boardId, teamNumber);
      setSlotTeamNumber((current) => ({ ...current, [boardId]: "" }));
      await loadBoardData(selectedRoundId);
      notify("Đã thêm slot.", "success");
    } catch {
      notify("Thêm slot thất bại.", "danger");
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
      notify(slotOccupied ? "Đã ghi đè đội trong slot." : "Đã gán đội vào slot.", "success");
    } catch {
      notify("Gán đội thất bại.", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveRound() {
    if (!selectedRoundId || !editRoundName.trim()) {
      notify("Chọn vòng và nhập tên.", "warning");
      return;
    }
    setBusy(true);
    try {
      await updateRound(selectedRoundId, {
        name: editRoundName.trim(),
        roundType: editRoundType,
        roundOrder: editRoundOrder,
        startAt: toIsoFromLocal(editRoundStartAt),
        endAt: toIsoFromLocal(editRoundEndAt)
      });
      await refreshRounds();
      notify("Đã lưu vòng thi.", "success");
    } catch {
      notify("Cập nhật vòng thi thất bại.", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveBoard(boardId: number) {
    const edit = boardEdits[boardId];
    if (!edit?.name.trim() || !selectedRoundId) {
      notify("Nhập tên bảng.", "warning");
      return;
    }
    setBusy(true);
    try {
      await updateBoard(boardId, {
        name: edit.name.trim(),
        boardOrder: edit.boardOrder,
        description: edit.description.trim() || undefined
      });
      await loadBoardData(selectedRoundId);
      notify("Đã lưu bảng thi.", "success");
    } catch {
      notify("Cập nhật bảng thi thất bại.", "danger");
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
      notify(`Đã phân công ${result?.assignedCount ?? 0} đội.`, "success");
    } catch {
      notify("Phân công ngẫu nhiên thất bại.", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleMove() {
    if (!selectedRoundId || !moveFromId || !moveToId) return;
    setBusy(true);
    try {
      await moveTeamBetweenSlots(selectedRoundId, Number(moveFromId), Number(moveToId));
      await loadBoardData(selectedRoundId);
      notify("Đã di chuyển đội giữa các slot.", "success");
    } catch {
      notify("Di chuyển thất bại.", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleSwap() {
    if (!selectedRoundId || !swapAId || !swapBId) return;
    setBusy(true);
    try {
      await swapBoardSlots(selectedRoundId, Number(swapAId), Number(swapBId));
      await loadBoardData(selectedRoundId);
      notify("Đã hoán đổi hai slot.", "success");
    } catch {
      notify("Hoán đổi thất bại.", "danger");
    } finally {
      setBusy(false);
    }
  }

  if (eventLoading || loading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Bảng thi và phân công"
        title="Quản lý bảng chấm"
        description="Tạo vòng, bảng, slot; gán đội thủ công hoặc ngẫu nhiên; di chuyển / hoán đổi slot."
        actions={
          <>
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

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg space-y-md">
        <h2 className="font-headline-sm text-on-surface">Thiết lập cấu trúc</h2>
        {rounds.length === 0 ? (
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
            <div className="flex items-end">
              <Button type="button" disabled={busy} onClick={handleCreateRound}>
                Tạo vòng thi
              </Button>
            </div>
          </div>
        ) : (
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
            <div className="flex flex-wrap items-end gap-sm border-t border-outline-variant pt-md">
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
        )}
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
        <section className="rounded-xl border border-outline-variant bg-surface-container p-lg space-y-md">
          <h2 className="font-headline-sm text-on-surface">Di chuyển / hoán đổi slot</h2>
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
        <section className="grid gap-md lg:grid-cols-2">
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

      <p className="font-body-sm text-on-surface-variant">
        {confirmedTeams.length} đội đã xác nhận trong sự kiện (dùng cho gán slot thủ công).
      </p>
    </div>
  );
}
