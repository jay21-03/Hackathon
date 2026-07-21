import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { ConfirmAction } from "../../feedback/ConfirmAction";
import { RemoveIconButton } from "../../ui/RemoveIconButton";
import { getStatusLabel, getStatusTone } from "../../../domain/status";
import type { AssignmentResponse } from "../../../services/assignmentService";
import type { BoardResponse, RoundResponse } from "../../../services/contestApi";
import type { UserSummaryResponse } from "../../../services/userService";
import { resolveAssigneeLabel } from "../../../utils/assigneeLabels";

interface BoardStaffSectionProps {
  mode: "mentor" | "judge";
  rounds: RoundResponse[];
  boards: BoardResponse[];
  selectedRoundId: number | null;
  boardId: number | null;
  selectedBoard: BoardResponse | null;
  selectedRound: RoundResponse | null;
  assigned: AssignmentResponse[];
  staffPool: UserSummaryResponse[];
  userNameById: Record<number, string>;
  blockedAssigneeIds?: number[];
  blockedAssigneeReason?: string;
  pickValue: string;
  pickError?: string | null;
  busy: boolean;
  staffPoolScope?: string | null;
  onRoundChange: (roundId: number) => void;
  onBoardChange: (boardId: number) => void;
  onPickChange: (value: string) => void;
  onAssign: () => void;
  onRemove: (assigneeId: number) => void;
}

function roundTypeLabel(roundType: string) {
  return roundType === "FINAL" ? "Chung kết" : "Vòng bảng";
}

export function BoardStaffSection({
  mode,
  rounds,
  boards,
  selectedRoundId,
  boardId,
  selectedBoard,
  selectedRound,
  assigned,
  staffPool,
  userNameById,
  blockedAssigneeIds = [],
  blockedAssigneeReason,
  pickValue,
  pickError,
  busy,
  staffPoolScope,
  onRoundChange,
  onBoardChange,
  onPickChange,
  onAssign,
  onRemove
}: BoardStaffSectionProps) {
  const isMentor = mode === "mentor";
  const title = isMentor ? "Gán mentor" : "Gán giám khảo";
  const roleLabel = isMentor ? "Mentor" : "Giám khảo";
  const emptyLabel = isMentor ? "Chưa có mentor trên bảng này." : "Chưa có giám khảo trên bảng này.";
  const addLabel = isMentor ? "Thêm mentor" : "Thêm giám khảo";
  const blockedIds = new Set(blockedAssigneeIds);
  const selectableStaffCount = staffPool.filter((user) => !blockedIds.has(user.id)).length;
  const hasStaffOptions = selectableStaffCount > 0;

  return (
    <section className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-md">
      <div className="grid gap-md md:grid-cols-2">
        {rounds.length > 0 ? (
          <label className="flex flex-col gap-xs font-label-sm text-on-surface-variant">
            Vòng thi
            <select
              className="form-input"
              value={selectedRoundId ?? ""}
              onChange={(e) => onRoundChange(Number(e.target.value))}
            >
              {rounds.map((round) => (
                <option key={round.id} value={round.id}>
                  {round.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex flex-col gap-xs font-label-sm text-on-surface-variant">
          Bảng thi
          <select
            className="form-input"
            value={boardId ?? ""}
            onChange={(e) => onBoardChange(Number(e.target.value))}
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedBoard && selectedRound ? (
        <div className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm">
          <p className="font-label-sm text-on-surface-variant">
            {selectedRound.name} · {roundTypeLabel(selectedRound.roundType)} · Bảng #{selectedBoard.boardOrder}
          </p>
          <div className="mt-xs flex flex-wrap items-center gap-sm">
            <h2 className="font-headline-sm text-on-surface">{selectedBoard.name}</h2>
            <Badge tone={getStatusTone(selectedBoard.status)}>{getStatusLabel(selectedBoard.status)}</Badge>
          </div>
        </div>
      ) : null}

      <div className="space-y-sm">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <p className="font-label-md text-on-surface">{title}</p>
          {staffPoolScope ? (
            <span className="font-label-sm text-on-surface-variant">
              Lọc theo học kỳ: {staffPoolScope}
            </span>
          ) : null}
        </div>
        <p className="font-body-sm text-on-surface-variant">
          {roleLabel} được gán theo bảng — đổi bảng ở trên để phân công bảng khác.
        </p>
        {assigned.length === 0 ? (
          <p className="font-body-sm text-on-surface-variant">{emptyLabel}</p>
        ) : (
          <ul className="flex flex-wrap gap-sm">
            {assigned.map((row) => (
              <li
                key={row.id}
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-high px-sm py-xs font-body-sm"
              >
                {resolveAssigneeLabel(row, userNameById)}
                <ConfirmAction
                  title={isMentor ? "Xóa mentor khỏi bảng?" : "Xóa giám khảo khỏi bảng?"}
                  message={
                    isMentor
                      ? `Xóa ${resolveAssigneeLabel(row, userNameById)} khỏi bảng «${selectedBoard?.name ?? "này"}»?`
                      : `Xóa ${resolveAssigneeLabel(row, userNameById)} khỏi bảng «${selectedBoard?.name ?? "này"}»? Phiếu chấm nháp (nếu có) sẽ bị xóa.`
                  }
                  confirmLabel={isMentor ? "Xóa mentor" : "Xóa giám khảo"}
                  onConfirm={() => onRemove(row.assigneeId)}
                >
                  <RemoveIconButton
                    label={`Xóa ${resolveAssigneeLabel(row, userNameById)}`}
                    disabled={busy}
                  />
                </ConfirmAction>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-start gap-sm pt-xs">
          <label className="flex min-w-[200px] flex-col gap-xs font-label-sm text-on-surface-variant">
            {addLabel}
            <select
              className={`form-input${pickError ? " border-error" : ""}`}
              value={pickValue}
              disabled={staffPool.length === 0 || busy}
              onChange={(e) => onPickChange(e.target.value)}
            >
              <option value="">
                {staffPool.length > 0 ? addLabel : `Chưa có ${roleLabel.toLowerCase()}`}
              </option>
              {staffPool.map((user) => {
                const blocked = blockedIds.has(user.id);
                return (
                  <option key={user.id} value={user.id} disabled={blocked}>
                    {user.fullName}
                    {blocked && blockedAssigneeReason ? ` (${blockedAssigneeReason})` : ""}
                  </option>
                );
              })}
            </select>
            {pickError ? <span className="font-body-sm text-error">{pickError}</span> : null}
          </label>
          <Button
            type="button"
            size="sm"
            className="mt-[1.35rem]"
            disabled={busy || !pickValue || !hasStaffOptions}
            onClick={onAssign}
          >
            Gán
          </Button>
        </div>
        {staffPool.length > 0 && !hasStaffOptions ? (
          <p className="font-body-sm text-on-surface-variant">
            Các {roleLabel.toLowerCase()} còn lại đang bị chặn cho bảng này.
          </p>
        ) : null}
        {staffPool.length === 0 ? (
          <p className="font-body-sm text-on-surface-variant">
            {staffPoolScope
              ? `Chưa có ${roleLabel.toLowerCase()} trong học kỳ ${staffPoolScope}. Mời qua mục Lời mời hoặc gán sau khi họ chấp nhận lời mời.`
              : `Chưa có tài khoản ${roleLabel.toLowerCase()} — tạo hoặc gán vai trò trong mục Người dùng.`}
          </p>
        ) : null}
      </div>
    </section>
  );
}
