import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import type { RoundResponse } from "../../../services/contestApi";
import type { BoardWithSlots } from "../../../pages/organizer/boardManagementUtils";
import { getStatusLabel, getStatusTone } from "../../../domain/status";

export interface BoardEditState {
  name: string;
  boardOrder: number;
  description: string;
}

export interface BoardListSectionProps {
  selectedRound: RoundResponse | null;
  boards: BoardWithSlots[];
  boardEdits: Record<number, BoardEditState>;
  boardName: string;
  boardOrder: number;
  createBoardFieldErrors: Record<string, string>;
  boardFieldErrors: Record<number, Record<string, string>>;
  busy: boolean;
  selectedRoundId: number | null;
  onBoardNameChange: (value: string) => void;
  onBoardOrderChange: (value: number) => void;
  onBoardEditsChange: (
    updater: (current: Record<number, BoardEditState>) => Record<number, BoardEditState>
  ) => void;
  onCreateBoard: () => void;
  onSaveBoard: (boardId: number) => void;
  onDeleteBoard: (boardId: number) => void;
  onClearBoardFieldError: (boardId: number, field: string) => void;
}

export function BoardListSection({
  selectedRound,
  boards,
  boardEdits,
  boardName,
  boardOrder,
  createBoardFieldErrors,
  boardFieldErrors,
  busy,
  selectedRoundId,
  onBoardNameChange,
  onBoardOrderChange,
  onBoardEditsChange,
  onCreateBoard,
  onSaveBoard,
  onDeleteBoard,
  onClearBoardFieldError
}: BoardListSectionProps) {
  return (
    <section
      id="board-step-board"
      className="scroll-mt-24 space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg"
    >
      <h2 className="font-headline-sm text-on-surface">Thiết lập cấu trúc — Bảng</h2>
      <p className="font-body-sm text-on-surface-variant">
        Vòng đang chọn: <strong>{selectedRound?.name ?? "—"}</strong>
      </p>
      <div className="flex flex-wrap items-end gap-sm rounded-lg border border-outline-variant bg-surface-container-low p-md">
        <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
          Tên bảng mới
          <input
            className={`form-input min-w-[200px]${createBoardFieldErrors.name ? " border-error" : ""}`}
            value={boardName}
            onChange={(e) => onBoardNameChange(e.target.value)}
            placeholder="Bảng A"
          />
          {createBoardFieldErrors.name ? (
            <span className="font-body-sm text-error">{createBoardFieldErrors.name}</span>
          ) : null}
        </label>
        <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
          Thứ tự bảng
          <input
            type="number"
            min={1}
            className={`form-input w-24${createBoardFieldErrors.boardOrder ? " border-error" : ""}`}
            value={boardOrder}
            onChange={(e) => onBoardOrderChange(Number(e.target.value))}
          />
          {createBoardFieldErrors.boardOrder ? (
            <span className="font-body-sm text-error">{createBoardFieldErrors.boardOrder}</span>
          ) : null}
        </label>
        <Button type="button" variant="secondary" disabled={busy || !selectedRoundId} onClick={onCreateBoard}>
          Thêm bảng
        </Button>
      </div>
      {boards.length === 0 ? (
        <p className="font-body-sm text-on-surface-variant">Chưa có bảng — thêm ít nhất một bảng cho vòng này.</p>
      ) : (
        <div className="grid gap-md lg:grid-cols-2">
          {boards.map(({ board }) => {
            const edit = boardEdits[board.id] ?? {
              name: board.name,
              boardOrder: board.boardOrder,
              description: board.description ?? ""
            };
            const fieldErrors = boardFieldErrors[board.id] ?? {};
            return (
              <article
                key={board.id}
                className="rounded-xl border border-outline-variant bg-surface-container-low p-md"
              >
                <div className="flex items-start justify-between gap-md">
                  <h3 className="font-label-md text-on-surface">{board.name}</h3>
                  <Badge tone={getStatusTone(board.status)}>{getStatusLabel(board.status)}</Badge>
                </div>
                <div className="mt-md grid gap-sm sm:grid-cols-2">
                  <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant sm:col-span-2">
                    Tên bảng
                    <input
                      className={`form-input${fieldErrors.name ? " border-error" : ""}`}
                      value={edit.name}
                      onChange={(e) => {
                        onClearBoardFieldError(board.id, "name");
                        onBoardEditsChange((current) => ({
                          ...current,
                          [board.id]: { ...edit, name: e.target.value }
                        }));
                      }}
                    />
                    {fieldErrors.name ? (
                      <span className="font-body-sm text-error">{fieldErrors.name}</span>
                    ) : null}
                  </label>
                  <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant">
                    Thứ tự
                    <input
                      type="number"
                      min={1}
                      className={`form-input${fieldErrors.boardOrder ? " border-error" : ""}`}
                      value={edit.boardOrder}
                      onChange={(e) => {
                        onClearBoardFieldError(board.id, "boardOrder");
                        onBoardEditsChange((current) => ({
                          ...current,
                          [board.id]: { ...edit, boardOrder: Number(e.target.value) }
                        }));
                      }}
                    />
                    {fieldErrors.boardOrder ? (
                      <span className="font-body-sm text-error">{fieldErrors.boardOrder}</span>
                    ) : null}
                  </label>
                  <div className="flex flex-wrap items-end gap-sm">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => onSaveBoard(board.id)}
                    >
                      Lưu bảng
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => onDeleteBoard(board.id)}
                    >
                      Xóa bảng
                    </Button>
                  </div>
                  <label className="grid gap-xs font-label-sm normal-case text-on-surface-variant sm:col-span-2">
                    Mô tả
                    <input
                      className={`form-input${fieldErrors.description ? " border-error" : ""}`}
                      value={edit.description}
                      onChange={(e) => {
                        onClearBoardFieldError(board.id, "description");
                        onBoardEditsChange((current) => ({
                          ...current,
                          [board.id]: { ...edit, description: e.target.value }
                        }));
                      }}
                    />
                    {fieldErrors.description ? (
                      <span className="font-body-sm text-error">{fieldErrors.description}</span>
                    ) : null}
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
