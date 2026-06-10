import { sanitizeProblemHtml } from "../../utils/sanitizeProblemHtml";
import { downloadAuthenticatedFile, isApiFileUrl } from "../../utils/downloadAuthenticatedFile";

interface ProblemContentViewProps {
  description?: string | null;
  externalLink?: string | null;
  attachmentUrl?: string | null;
  attachmentFileName?: string | null;
  previewMode?: boolean;
}

export function ProblemContentView({
  description,
  externalLink,
  attachmentUrl,
  attachmentFileName,
  previewMode = false
}: ProblemContentViewProps) {
  const hasHtml = Boolean(description?.trim());

  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container p-lg space-y-md">
      {hasHtml ? (
        <div
          className="problem-content font-body-md text-on-surface prose prose-invert max-w-none [&_a]:text-primary [&_table]:w-full [&_td]:border [&_td]:border-outline-variant [&_th]:border [&_th]:border-outline-variant [&_th]:bg-surface-container-high"
          dangerouslySetInnerHTML={{ __html: sanitizeProblemHtml(description ?? "") }}
        />
      ) : (
        <p className="font-body-sm text-on-surface-variant">Ban tổ chức chưa nhập mô tả chi tiết.</p>
      )}

      {externalLink ? (
        <p className="font-body-sm">
          <a
            href={externalLink}
            className="inline-flex items-center gap-xs text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            <span className="material-symbols-outlined text-base">link</span>
            Link tham khảo (Google Drive / tài liệu)
          </a>
        </p>
      ) : null}

      {attachmentUrl ? (
        <p className="font-body-sm">
          {previewMode ? (
            <span className="inline-flex items-center gap-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-base">attach_file</span>
              Tệp đính kèm: {attachmentFileName ?? "đã chọn"}
            </span>
          ) : isApiFileUrl(attachmentUrl) ? (
            <button
              type="button"
              className="inline-flex items-center gap-xs text-primary hover:underline"
              onClick={() => void downloadAuthenticatedFile(attachmentUrl, "de-thi")}
            >
              <span className="material-symbols-outlined text-base">attach_file</span>
              Tải tệp đính kèm
            </button>
          ) : (
            <a
              href={attachmentUrl}
              className="inline-flex items-center gap-xs text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              <span className="material-symbols-outlined text-base">attach_file</span>
              Tệp đính kèm
            </a>
          )}
        </p>
      ) : null}
    </article>
  );
}
