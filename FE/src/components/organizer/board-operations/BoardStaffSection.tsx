import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { getStatusLabel, getStatusTone } from "../../../domain/status";
import type { AssignmentResponse } from "../../../services/assignmentService";
import type { BoardResponse, RoundResponse } from "../../../services/contestApi";
import type { UserSummaryResponse } from "../../../services/userService";

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
  pickValue: string;
  busy: boolean;
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
  pickValue,
  busy,
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

  return (
    <section className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
      <div className="grid gap-md md:grid-cols-2">
        {rounds.length > 1 ? (
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
        <p className="font-label-md text-on-surface">{title}</p>
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
                {userNameById[row.assigneeId] ?? `User #${row.assigneeId}`}
                <button
                  type="button"
                  className="font-label-sm text-error hover:underline"
                  disabled={busy}
                  onClick={() => onRemove(row.assigneeId)}
                >
                  Gỡ
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-sm pt-xs">
          <select
            className="form-input min-w-[200px]"
            value={pickValue}
            onChange={(e) => onPickChange(e.target.value)}
          >
            <option value="">{addLabel}</option>
            {staffPool.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </select>
          <Button type="button" size="sm" disabled={busy} onClick={onAssign}>
            Gán
          </Button>
        </div>
        {staffPool.length === 0 ? (
          <p className="font-body-sm text-on-surface-variant">
            Chưa có tài khoản {roleLabel.toLowerCase()} — tạo hoặc gán vai trò trong mục Người dùng.
          </p>
        ) : null}
      </div>
    </section>
  );
}
