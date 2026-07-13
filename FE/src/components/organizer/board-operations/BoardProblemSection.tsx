import { ProblemFileUploadZone } from "../ProblemFileUploadZone";
import { ProblemLivePreview } from "../ProblemLivePreview";
import { ProblemRichTextEditor } from "../ProblemRichTextEditor";
import { ConfirmAction } from "../../feedback/ConfirmAction";
import { Button } from "../../ui/Button";
import type { BoardResponse, ProblemResponse, RoundResponse } from "../../../services/contestApi";

interface BoardProblemSectionProps {
  eventId: number;
  rounds: RoundResponse[];
  boards: BoardResponse[];
  selectedRoundId: number | null;
  boardId: number | null;
  problem: ProblemResponse | null;
  title: string;
  description: string;
  externalLink: string;
  attachmentUrl: string | null;
  attachmentFileName: string | null;
  releaseAt: string;
  closeAt: string;
  saving: boolean;
  deleting: boolean;
  fieldErrors?: Record<string, string>;
  onRoundChange: (roundId: number) => void;
  onBoardChange: (boardId: number) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onExternalLinkChange: (value: string) => void;
  onReleaseAtChange: (value: string) => void;
  onCloseAtChange: (value: string) => void;
  onAttachmentUploaded: (url: string, fileName: string) => void;
  onAttachmentClear: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export function BoardProblemSection({
  eventId,
  rounds,
  boards,
  selectedRoundId,
  boardId,
  problem,
  title,
  description,
  externalLink,
  attachmentUrl,
  attachmentFileName,
  releaseAt,
  closeAt,
  saving,
  deleting,
  fieldErrors = {},
  onRoundChange,
  onBoardChange,
  onTitleChange,
  onDescriptionChange,
  onExternalLinkChange,
  onReleaseAtChange,
  onCloseAtChange,
  onAttachmentUploaded,
  onAttachmentClear,
  onSave,
  onDelete
}: BoardProblemSectionProps) {
  return (
    <div className="space-y-lg">
      <section className="grid gap-lg xl:grid-cols-[1fr_320px]">
        <form className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
          {rounds.length > 0 ? (
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm normal-case text-on-surface-variant">Vòng thi</span>
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
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Bảng thi</span>
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
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Tên đề thi</span>
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className={`form-input ${fieldErrors.title ? "border-error" : ""}`}
            />
            {fieldErrors.title ? (
              <span className="font-body-sm text-error">{fieldErrors.title}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Thời gian mở đề</span>
            <input
              value={releaseAt}
              onChange={(e) => onReleaseAtChange(e.target.value)}
              className={`form-input ${fieldErrors.releaseAt ? "border-error" : ""}`}
              type="datetime-local"
              data-testid="problem-release-at"
            />
            {fieldErrors.releaseAt ? (
              <span className="font-body-sm text-error">{fieldErrors.releaseAt}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Thời gian đóng đề</span>
            <input
              value={closeAt}
              onChange={(e) => onCloseAtChange(e.target.value)}
              className={`form-input ${fieldErrors.closeAt ? "border-error" : ""}`}
              type="datetime-local"
              data-testid="problem-close-at"
            />
            {fieldErrors.closeAt ? (
              <span className="font-body-sm text-error">{fieldErrors.closeAt}</span>
            ) : null}
          </label>
          <div className="flex flex-col gap-sm">
            <span className="font-label-sm normal-case text-on-surface-variant">Nội dung đề</span>
            {fieldErrors.description ? (
              <span className="font-body-sm text-error">{fieldErrors.description}</span>
            ) : null}
            <div className="grid gap-md xl:grid-cols-2">
              <ProblemRichTextEditor
                value={description}
                onChange={onDescriptionChange}
                disabled={saving || deleting}
              />
              <ProblemLivePreview
                title={title}
                description={description}
                externalLink={externalLink}
                attachmentUrl={attachmentUrl}
                attachmentFileName={attachmentFileName}
              />
            </div>
          </div>
          <div className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">
              Tệp đính kèm (PDF / DOCX / ZIP)
            </span>
            <ProblemFileUploadZone
              eventId={eventId}
              attachmentUrl={attachmentUrl}
              fileName={attachmentFileName}
              disabled={saving || deleting}
              onUploaded={onAttachmentUploaded}
              onClear={onAttachmentClear}
            />
          </div>
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">
              Link Google Drive / tài liệu tham khảo
            </span>
            <input
              value={externalLink}
              onChange={(e) => onExternalLinkChange(e.target.value)}
              className={`form-input ${fieldErrors.externalLink ? "border-error" : ""}`}
              type="url"
              placeholder="https://drive.google.com/..."
            />
            {fieldErrors.externalLink ? (
              <span className="font-body-sm text-error">{fieldErrors.externalLink}</span>
            ) : null}
          </label>
          <div className="flex flex-wrap gap-sm">
            <Button type="button" disabled={saving || deleting} onClick={onSave}>
              {saving ? "Đang lưu" : problem ? "Cập nhật đề" : "Tạo đề thi"}
            </Button>
            {problem ? (
              <ConfirmAction
                title="Xóa đề thi?"
                message={`Xóa đề «${problem.title}» trên bảng đang chọn.`}
                confirmLabel="Xóa đề"
                onConfirm={onDelete}
              >
                <Button type="button" variant="danger" disabled={saving || deleting}>
                  {deleting ? "Đang xóa" : "Xóa đề"}
                </Button>
              </ConfirmAction>
            ) : null}
          </div>
        </form>

        <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Quy tắc cần giữ</h2>
          <div className="mt-md space-y-sm font-body-sm text-on-surface-variant">
            <p>Thí sinh chỉ xem đề từ lúc mở đến trước lúc đóng.</p>
            <p>Thời gian đóng phải sau thời gian mở.</p>
            <p>Mỗi bảng một đề — đổi bảng ở dropdown để cấu hình bảng khác.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
