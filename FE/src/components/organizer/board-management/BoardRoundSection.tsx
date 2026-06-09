import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Icon } from "../../ui/Icon";
import type { RoundResponse } from "../../../services/contestApi";
import { isRoundRunning } from "../../../utils/pickActiveRound";

export interface BoardRoundSectionProps {
  rounds: RoundResponse[];
  activeRound: RoundResponse | null;
  selectedRoundId: number | null;
  busy: boolean;
  showAddRound: boolean;
  roundName: string;
  roundType: "GROUP_STAGE" | "FINAL";
  roundOrder: number;
  roundStartAt: string;
  roundEndAt: string;
  editRoundName: string;
  editRoundType: "GROUP_STAGE" | "FINAL";
  editRoundOrder: number;
  editRoundStartAt: string;
  editRoundEndAt: string;
  onRoundNameChange: (value: string) => void;
  onRoundTypeChange: (value: "GROUP_STAGE" | "FINAL") => void;
  onRoundOrderChange: (value: number) => void;
  onRoundStartAtChange: (value: string) => void;
  onRoundEndAtChange: (value: string) => void;
  onEditRoundNameChange: (value: string) => void;
  onEditRoundTypeChange: (value: "GROUP_STAGE" | "FINAL") => void;
  onEditRoundOrderChange: (value: number) => void;
  onEditRoundStartAtChange: (value: string) => void;
  onEditRoundEndAtChange: (value: string) => void;
  onOpenAddRoundForm: () => void;
  onCreateRound: () => void;
  onCancelAddRound: () => void;
  onSaveRound: () => void;
}

export function BoardRoundSection({
  rounds,
  activeRound,
  selectedRoundId,
  busy,
  showAddRound,
  roundName,
  roundType,
  roundOrder,
  roundStartAt,
  roundEndAt,
  editRoundName,
  editRoundType,
  editRoundOrder,
  editRoundStartAt,
  editRoundEndAt,
  onRoundNameChange,
  onRoundTypeChange,
  onRoundOrderChange,
  onRoundStartAtChange,
  onRoundEndAtChange,
  onEditRoundNameChange,
  onEditRoundTypeChange,
  onEditRoundOrderChange,
  onEditRoundStartAtChange,
  onEditRoundEndAtChange,
  onOpenAddRoundForm,
  onCreateRound,
  onCancelAddRound,
  onSaveRound
}: BoardRoundSectionProps) {
  return (
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
              onClick={onOpenAddRoundForm}
            >
              Thêm vòng mới
            </Button>
          </div>
        ) : null}
      </div>
      {rounds.length === 0 || showAddRound ? (
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md space-y-md">
          {showAddRound ? <p className="font-label-md text-on-surface">Tạo vòng mới</p> : null}
          <div className="grid gap-md md:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
              Tên vòng
              <input className="form-input" value={roundName} onChange={(e) => onRoundNameChange(e.target.value)} />
            </label>
            <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
              Loại vòng
              <select
                className="form-input"
                value={roundType}
                onChange={(e) => onRoundTypeChange(e.target.value as "GROUP_STAGE" | "FINAL")}
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
                onChange={(e) => onRoundOrderChange(Number(e.target.value))}
              />
            </label>
            <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
              Bắt đầu
              <input
                type="datetime-local"
                className="form-input"
                value={roundStartAt}
                onChange={(e) => onRoundStartAtChange(e.target.value)}
              />
            </label>
            <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
              Kết thúc
              <input
                type="datetime-local"
                className="form-input"
                value={roundEndAt}
                onChange={(e) => onRoundEndAtChange(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap items-end gap-sm">
              <Button type="button" disabled={busy} onClick={onCreateRound}>
                {showAddRound ? "Tạo vòng" : "Tạo vòng thi"}
              </Button>
              {showAddRound ? (
                <Button type="button" variant="ghost" disabled={busy} onClick={onCancelAddRound}>
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
                    onChange={(e) => onEditRoundNameChange(e.target.value)}
                  />
                </label>
                <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                  Loại vòng
                  <select
                    className="form-input"
                    value={editRoundType}
                    onChange={(e) => onEditRoundTypeChange(e.target.value as "GROUP_STAGE" | "FINAL")}
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
                    onChange={(e) => onEditRoundOrderChange(Number(e.target.value))}
                  />
                </label>
                <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                  Bắt đầu
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={editRoundStartAt}
                    onChange={(e) => onEditRoundStartAtChange(e.target.value)}
                  />
                </label>
                <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                  Kết thúc
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={editRoundEndAt}
                    onChange={(e) => onEditRoundEndAtChange(e.target.value)}
                  />
                </label>
                <div className="flex items-end">
                  <Button type="button" disabled={busy} onClick={onSaveRound}>
                    Lưu vòng
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
