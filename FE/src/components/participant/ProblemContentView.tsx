import { sanitizeProblemHtml } from "../../utils/sanitizeProblemHtml";
import { downloadAuthenticatedFile, isApiFileUrl } from "../../utils/downloadAuthenticatedFile";
import type { CriteriaResponse } from "../../services/scoringApi";

interface ProblemContentViewProps {
  description?: string | null;
  externalLink?: string | null;
  attachmentUrl?: string | null;
  attachmentFileName?: string | null;
  criteria?: CriteriaResponse[];
  rubricLoading?: boolean;
  rubricError?: string | null;
  previewMode?: boolean;
}

export function ProblemContentView({
  description,
  externalLink,
  attachmentUrl,
  attachmentFileName,
  criteria = [],
  rubricLoading = false,
  rubricError = null,
  previewMode = false
}: ProblemContentViewProps) {
  const hasHtml = Boolean(description?.trim());
  const showRubricSection = !previewMode || rubricLoading || rubricError || criteria.length > 0;

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

      {showRubricSection ? (
        <section className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <div>
              <h3 className="font-title-sm text-on-surface">Rubric & thang điểm</h3>
              <p className="mt-1 font-body-sm text-on-surface-variant">
                Tiêu chí chấm chính thức do ban tổ chức công bố cho vòng thi.
              </p>
            </div>
            {criteria.length > 0 ? (
              <span className="rounded-full border border-outline-variant px-sm py-1 font-label-sm text-on-surface-variant">
                {criteria.length} tiêu chí
              </span>
            ) : null}
          </div>

          {rubricLoading ? (
            <p className="mt-sm font-body-sm text-on-surface-variant">Đang tải rubric...</p>
          ) : rubricError ? (
            <p className="mt-sm font-body-sm text-error">{rubricError}</p>
          ) : criteria.length === 0 ? (
            <p className="mt-sm font-body-sm text-on-surface-variant">
              Ban tổ chức chưa cấu hình rubric cho vòng thi này.
            </p>
          ) : (
            <div className="mt-sm overflow-x-auto">
              <table className="min-w-full table-fixed text-left">
                <colgroup>
                  <col />
                  <col className="w-24" />
                  <col className="w-28" />
                </colgroup>
                <thead className="table-header-bg">
                  <tr className="font-label-sm text-on-surface-variant">
                    <th className="px-sm py-xs">Tiêu chí</th>
                    <th className="px-sm py-xs text-right">Trọng số</th>
                    <th className="px-sm py-xs text-right">Thang điểm</th>
                  </tr>
                </thead>
                <tbody className="table-divider font-body-sm">
                  {criteria.map((item) => (
                    <tr key={item.id}>
                      <td className="px-sm py-sm">
                        <span className="font-label-md text-on-surface">{item.name}</span>
                        {item.description ? (
                          <span className="mt-xs block text-on-surface-variant">{item.description}</span>
                        ) : null}
                        {item.levelDescriptors?.length ? (
                          <div className="mt-sm grid gap-xs sm:grid-cols-2">
                            {item.levelDescriptors.map((level) => (
                              <div
                                key={`${item.id}-${level.level}`}
                                className="rounded-md border border-outline-variant/70 bg-surface-container-lowest px-sm py-xs"
                              >
                                <div className="flex items-center justify-between gap-xs">
                                  <span className="font-label-sm text-on-surface">{level.label}</span>
                                  <span className="font-label-sm tabular-nums text-on-surface-variant">
                                    {level.minScore}-{level.maxScore}
                                  </span>
                                </div>
                                {level.description ? (
                                  <p className="mt-1 text-on-surface-variant">{level.description}</p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-sm py-sm text-right tabular-nums">{item.weight}%</td>
                      <td className="px-sm py-sm text-right tabular-nums">
                        {item.minScore}-{item.maxScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </article>
  );
}
