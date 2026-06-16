import { ConfirmAction } from "../../feedback/ConfirmAction";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Icon } from "../../ui/Icon";
import type { BoardSlotResponse } from "../../../services/contestApi";
import type { TeamDetailResponse } from "../../../services/registrationService";
import { getStatusLabel, getStatusTone } from "../../../domain/status";
import {
  boardAssignmentStats,
  countTeamMembers,
  type BoardWithSlots
} from "../../../pages/organizer/boardManagementUtils";

export interface SlotListItem {
  slot: BoardSlotResponse;
  label: string;
}

export interface BoardSlotsSectionProps {
  boards: BoardWithSlots[];
  teams: TeamDetailResponse[];
  confirmedTeamCount: number;
  teamMap: Record<number, string>;
  teamById: Record<number, TeamDetailResponse>;
  allSlots: SlotListItem[];
  stats: { assignedCount: number; slotsCount: number };
  busy: boolean;
  selectedRoundId: number | null;
  forceReplace: boolean;
  slotTeamNumber: Record<number, string>;
  moveFromId: string;
  moveToId: string;
  swapAId: string;
  swapBId: string;
  onForceReplaceChange: (value: boolean) => void;
  onSlotTeamNumberChange: (boardId: number, value: string) => void;
  onSlotTeamPickChange: (slotId: number, value: string) => void;
  onMoveFromIdChange: (value: string) => void;
  onMoveToIdChange: (value: string) => void;
  onSwapAIdChange: (value: string) => void;
  onSwapBIdChange: (value: string) => void;
  slotPickValue: (slot: BoardSlotResponse) => string;
  teamsForSlot: (slotId: number, currentTeamId: number | null) => TeamDetailResponse[];
  onRandomAssign: () => void;
  onMove: () => void;
  onSwap: () => void;
  onCreateSlot: (boardId: number) => void;
  onAssignSlot: (slotId: number, slotOccupied: boolean) => void;
  onUnassignSlot: (slotId: number) => void;
  onDeleteSlot: (slotId: number) => void;
  onOpenTeamDetail: (teamId: number, contextLabel: string) => void;
  showAssignment?: boolean;
}

export function BoardSlotsSection({
  boards,
  teams,
  confirmedTeamCount,
  teamMap,
  teamById,
  allSlots,
  stats,
  busy,
  selectedRoundId,
  forceReplace,
  slotTeamNumber,
  moveFromId,
  moveToId,
  swapAId,
  swapBId,
  onForceReplaceChange,
  onSlotTeamNumberChange,
  onSlotTeamPickChange,
  onMoveFromIdChange,
  onMoveToIdChange,
  onSwapAIdChange,
  onSwapBIdChange,
  slotPickValue,
  teamsForSlot,
  onRandomAssign,
  onMove,
  onSwap,
  onCreateSlot,
  onAssignSlot,
  onUnassignSlot,
  onDeleteSlot,
  onOpenTeamDetail,
  showAssignment = true
}: BoardSlotsSectionProps) {
  return (
    <section
      id={showAssignment ? "board-step-slots" : "board-step-layout-slots"}
      className="scroll-mt-24 rounded-xl border border-outline-variant bg-surface-container p-lg space-y-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div>
          <h2 className="font-headline-sm text-on-surface">
            {showAssignment ? "Vị trí & gán đội" : "Vị trí trên bảng"}
          </h2>
          <p className="mt-xs font-body-sm text-on-surface-variant">
            {showAssignment
              ? "Thêm vị trí và gán đội — có thể dùng phân công ngẫu nhiên."
              : "Thêm vị trí trống — gán đội tại Vận hành bảng khi đã có đội xác nhận."}
          </p>
        </div>
        {showAssignment ? (
          <Button type="button" disabled={busy || !selectedRoundId} onClick={onRandomAssign}>
            Phân công ngẫu nhiên
          </Button>
        ) : null}
      </div>

      {showAssignment ? (
        <div className="flex flex-wrap gap-md rounded-lg border border-outline-variant/60 bg-surface-container-low p-md font-body-sm text-on-surface-variant">
          <span>
            <strong className="text-on-surface">{confirmedTeamCount}</strong> đội đã xác nhận
          </span>
          <span>·</span>
          <span>
            <strong className="text-on-surface">{stats.assignedCount}</strong>/{stats.slotsCount} vị trí
            đã gán
          </span>
          <span>·</span>
          <a href="/organizer/teams-hub" className="text-primary hover:underline">
            Duyệt thêm đội
          </a>
        </div>
      ) : (
        <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-md font-body-sm text-on-surface-variant">
          <strong className="text-on-surface">{stats.slotsCount}</strong> vị trí trên các bảng đang chọn.
        </div>
      )}

      {showAssignment ? (
        <label className="inline-flex items-center gap-sm font-body-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={forceReplace}
            onChange={(e) => onForceReplaceChange(e.target.checked)}
            className="h-4 w-4 rounded border-outline-variant"
          />
          Ghi đè khi gán vào vị trí đã có đội
        </label>
      ) : null}

      {showAssignment && allSlots.length > 1 ? (
        <>
          <h3 className="font-label-md text-on-surface">Di chuyển / hoán đổi vị trí</h3>
          <div className="flex flex-wrap gap-md items-end">
            <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
              Từ vị trí
              <select
                className="form-input min-w-[220px]"
                value={moveFromId}
                onChange={(e) => onMoveFromIdChange(e.target.value)}
              >
                <option value="">—</option>
                {allSlots.map(({ slot, label }) => (
                  <option key={slot.id} value={slot.id}>
                    {label}
                    {slot.teamId ? ` · ${teamMap[slot.teamId]}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
              Đến vị trí
              <select
                className="form-input min-w-[220px]"
                value={moveToId}
                onChange={(e) => onMoveToIdChange(e.target.value)}
              >
                <option value="">—</option>
                {allSlots.map(({ slot, label }) => (
                  <option key={slot.id} value={slot.id}>
                    {label}
                    {slot.teamId ? ` · ${teamMap[slot.teamId]}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" variant="secondary" disabled={busy} onClick={onMove}>
              Di chuyển
            </Button>
          </div>
          <div className="flex flex-wrap gap-md items-end border-t border-outline-variant pt-md">
            <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
              Vị trí A
              <select
                className="form-input min-w-[220px]"
                value={swapAId}
                onChange={(e) => onSwapAIdChange(e.target.value)}
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
              Vị trí B
              <select
                className="form-input min-w-[220px]"
                value={swapBId}
                onChange={(e) => onSwapBIdChange(e.target.value)}
              >
                <option value="">—</option>
                {allSlots.map(({ slot, label }) => (
                  <option key={slot.id} value={slot.id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" variant="secondary" disabled={busy} onClick={onSwap}>
              Hoán đổi
            </Button>
          </div>
        </>
      ) : null}

      <div className="grid gap-md lg:grid-cols-2">
        {boards.map(({ board, slots }) => {
          const { teamCount, memberCount, slotCount } = boardAssignmentStats(slots, teams);
          return (
            <article
              key={board.id}
              className="rounded-xl border border-outline-variant bg-surface-container-low p-md space-y-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-sm">
                <div>
                  <h3 className="font-headline-sm text-on-surface">{board.name}</h3>
                  <p className="mt-xs font-body-sm text-on-surface-variant">
                    {teamCount} đội · {memberCount} thành viên · {slotCount} vị trí
                  </p>
                </div>
                <Badge tone={getStatusTone(board.status)}>{getStatusLabel(board.status)}</Badge>
              </div>

              <div className="flex flex-wrap items-end gap-sm rounded-lg border border-dashed border-outline-variant bg-surface-container px-md py-sm">
                <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                  Số vị trí mới
                  <input
                    type="number"
                    min={1}
                    className="form-input w-28"
                    value={slotTeamNumber[board.id] ?? ""}
                    onChange={(e) => onSlotTeamNumberChange(board.id, e.target.value)}
                  />
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => onCreateSlot(board.id)}
                >
                  Thêm vị trí
                </Button>
              </div>

              {slots.length === 0 ? (
                <p className="font-body-sm text-on-surface-variant">
                  {showAssignment
                    ? "Chưa có vị trí — thêm vị trí rồi gán đội ngay bên dưới."
                    : "Chưa có vị trí — dùng «Thêm vị trí» phía trên."}
                </p>
              ) : (
                <div className="space-y-sm">
                  {slots.map((slot) => {
                    const pickValue = slotPickValue(slot);
                    const displayTeam =
                      pickValue ? teamById[Number(pickValue)] : slot.teamId ? teamById[slot.teamId] : null;
                    return (
                      <div
                        key={slot.id}
                        className="rounded-lg border border-outline-variant bg-surface-container px-md py-sm"
                      >
                        <div className="flex flex-wrap items-center gap-sm">
                          <span className="shrink-0 font-label-sm text-on-surface">
                            Vị trí #{slot.teamNumber}
                          </span>
                          {showAssignment ? (
                            <>
                              <select
                                className="form-input min-w-[180px] flex-1"
                                value={pickValue}
                                onChange={(e) => onSlotTeamPickChange(slot.id, e.target.value)}
                              >
                                <option value="">Chọn đội đã duyệt</option>
                                {teamsForSlot(slot.id, slot.teamId).map((team) => {
                                  const { total, confirmed } = countTeamMembers(team);
                                  return (
                                    <option key={team.id} value={team.id}>
                                      {team.name} ({confirmed}/{total} TV)
                                    </option>
                                  );
                                })}
                              </select>
                              <Button
                                type="button"
                                size="sm"
                                disabled={busy || !pickValue}
                                onClick={() => onAssignSlot(slot.id, Boolean(slot.teamId))}
                              >
                                {slot.teamId ? "Ghi đè" : "Gán"}
                              </Button>
                              {displayTeam ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  icon={<Icon name="info" className="text-[18px]" />}
                                  onClick={() =>
                                    onOpenTeamDetail(
                                      displayTeam.id,
                                      `Bảng «${board.name}» · Vị trí #${slot.teamNumber}`
                                    )
                                  }
                                >
                                  Chi tiết đội
                                </Button>
                              ) : null}
                              {slot.teamId ? (
                                <ConfirmAction
                                  title="Gỡ đội khỏi vị trí?"
                                  message={`Gỡ «${teamMap[slot.teamId] ?? "đội này"}» khỏi vị trí #${slot.teamNumber}.`}
                                  confirmLabel="Gỡ đội"
                                  onConfirm={() => onUnassignSlot(slot.id)}
                                >
                                  <Button type="button" size="sm" variant="danger" disabled={busy}>
                                    Gỡ
                                  </Button>
                                </ConfirmAction>
                              ) : (
                                <ConfirmAction
                                  title="Xóa vị trí trống?"
                                  message={`Xóa vị trí #${slot.teamNumber} trên bảng «${board.name}».`}
                                  confirmLabel="Xóa vị trí"
                                  onConfirm={() => onDeleteSlot(slot.id)}
                                >
                                  <Button type="button" size="sm" variant="ghost" disabled={busy}>
                                    Xóa
                                  </Button>
                                </ConfirmAction>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="font-body-sm text-on-surface-variant">
                                {slot.teamId
                                  ? `${teamMap[slot.teamId] ?? "Đã gán"} — gỡ tại Vận hành bảng`
                                  : "Trống"}
                              </span>
                              {!slot.teamId ? (
                                <ConfirmAction
                                  title="Xóa vị trí trống?"
                                  message={`Xóa vị trí #${slot.teamNumber} trên bảng «${board.name}».`}
                                  confirmLabel="Xóa vị trí"
                                  onConfirm={() => onDeleteSlot(slot.id)}
                                >
                                  <Button type="button" size="sm" variant="ghost" disabled={busy}>
                                    Xóa
                                  </Button>
                                </ConfirmAction>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
