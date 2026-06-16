import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { BoardSlotsSection } from "../board-management/BoardSlotsSection";
import { TeamDetailModal } from "../../organizer/TeamDetailModal";
import { useToast } from "../../feedback/ToastProvider";
import { randomAssignSchema } from "../../../domain/schemas";
import { useBoardManagement } from "../../../hooks/useBoardManagement";
import { invalidateAfterBoardMutation } from "../../../lib/invalidateBoardQueries";
import {
  assignTeamToSlot,
  moveTeamBetweenSlots,
  randomAssignTeams,
  swapBoardSlots,
  unassignTeamFromSlot,
  type BoardSlotResponse
} from "../../../services/contestApi";
import { fetchTeam, type TeamDetailResponse } from "../../../services/registrationService";
import { resolveApiError } from "../../../utils/apiError";
import { createIdempotencyKey } from "../../../utils/idempotency";
import { zodFirstError } from "../../../utils/formValidation";

interface BoardTeamAssignmentSectionProps {
  eventId: number;
  selectedRoundId: number | null;
  onAssigned?: () => void;
}

export function BoardTeamAssignmentSection({
  eventId,
  selectedRoundId,
  onAssigned
}: BoardTeamAssignmentSectionProps) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const {
    boards,
    teams,
    confirmedTeams,
    confirmedTeamCount,
    teamMap,
    assignedTeamIds,
    slotTeamPick,
    setSlotTeamPick,
    setSelectedRoundId,
    loading,
    invalidate
  } = useBoardManagement(eventId);
  const [busy, setBusy] = useState(false);
  const [forceReplace, setForceReplace] = useState(false);
  const [slotTeamNumber, setSlotTeamNumber] = useState<Record<number, string>>({});
  const [moveFromId, setMoveFromId] = useState("");
  const [moveToId, setMoveToId] = useState("");
  const [swapAId, setSwapAId] = useState("");
  const [swapBId, setSwapBId] = useState("");
  const [detailTeam, setDetailTeam] = useState<TeamDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailContext, setDetailContext] = useState<string | undefined>();

  useEffect(() => {
    if (selectedRoundId != null) setSelectedRoundId(selectedRoundId);
  }, [selectedRoundId, setSelectedRoundId]);

  const teamById = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.id, team])),
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

  const stats = useMemo(() => {
    const slotsCount = boards.reduce((sum, item) => sum + item.slots.length, 0);
    const assignedCount = boards.reduce(
      (sum, item) => sum + item.slots.filter((slot) => slot.teamId).length,
      0
    );
    return { slotsCount, assignedCount };
  }, [boards]);

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

  async function openTeamDetail(teamId: number, contextLabel: string) {
    setDetailLoading(true);
    setDetailContext(contextLabel);
    try {
      setDetailTeam(await fetchTeam(teamId));
    } catch (err) {
      notify(resolveApiError(err, "Không tải được chi tiết đội."), "danger");
      setDetailTeam(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAssignSlot(slotId: number, slotOccupied: boolean) {
    const roundId = selectedRoundId;
    if (!roundId) return;
    const pick = slotTeamPick[slotId];
    const teamId = pick ? Number(pick) : NaN;
    if (!Number.isFinite(teamId)) {
      notify("Chọn đội trước khi gán.", "warning");
      return;
    }
    setBusy(true);
    try {
      await assignTeamToSlot(
        roundId,
        slotId,
        teamId,
        slotOccupied && forceReplace,
        createIdempotencyKey(`assign-slot-${slotId}`)
      );
      await invalidate();
      await invalidateAfterBoardMutation(queryClient);
      notify(slotOccupied ? "Đã ghi đè đội trong vị trí." : "Đã gán đội vào vị trí.", "success");
      onAssigned?.();
    } catch (err) {
      notify(resolveApiError(err, "Gán đội thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleRandomAssign() {
    const roundId = selectedRoundId;
    if (!roundId) return;
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
    const parsed = randomAssignSchema.safeParse({ seed: "demo" });
    if (!parsed.success) {
      notify(zodFirstError(parsed.error), "warning");
      return;
    }
    setBusy(true);
    try {
      const result = await randomAssignTeams(roundId, parsed.data);
      await invalidate();
      await invalidateAfterBoardMutation(queryClient);
      const count = result?.assignedCount ?? 0;
      notify(
        count === 0
          ? "Không gán thêm đội — kiểm tra đội xác nhận và vị trí trống."
          : `Đã phân công ${count} đội.`,
        count === 0 ? "warning" : "success"
      );
      if (count > 0) onAssigned?.();
    } catch (err) {
      notify(resolveApiError(err, "Phân công ngẫu nhiên thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnassignSlot(slotId: number) {
    const roundId = selectedRoundId;
    if (!roundId) return;
    setBusy(true);
    try {
      await unassignTeamFromSlot(roundId, slotId);
      await invalidate();
      notify("Đã gỡ đội khỏi vị trí.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gỡ đội thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return (
    <>
      <BoardSlotsSection
        boards={boards}
        teams={teams}
        confirmedTeamCount={confirmedTeamCount}
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
        onMove={async () => {
          const roundId = selectedRoundId;
          if (!roundId || !moveFromId || !moveToId) return;
          setBusy(true);
          try {
            await moveTeamBetweenSlots(
              roundId,
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
        }}
        onSwap={async () => {
          const roundId = selectedRoundId;
          if (!roundId || !swapAId || !swapBId) return;
          setBusy(true);
          try {
            await swapBoardSlots(
              roundId,
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
        }}
        onCreateSlot={() =>
          notify("Thêm vị trí mới tại Bảng thi → Bảng & vị trí.", "warning")
        }
        onAssignSlot={(slotId, occupied) => void handleAssignSlot(slotId, occupied)}
        onUnassignSlot={(slotId) => void handleUnassignSlot(slotId)}
        onDeleteSlot={() => notify("Xóa vị trí tại Bảng thi.", "warning")}
        onOpenTeamDetail={(teamId, contextLabel) => void openTeamDetail(teamId, contextLabel)}
        showAssignment
      />
      <TeamDetailModal
        open={detailLoading || detailTeam !== null}
        loading={detailLoading}
        team={detailTeam}
        contextLabel={detailContext}
        onClose={() => {
          setDetailTeam(null);
          setDetailContext(undefined);
        }}
      />
    </>
  );
}
