import { ProblemContentView } from "../participant/ProblemContentView";

interface ProblemLivePreviewProps {
  title: string;
  description: string;
  externalLink: string;
  attachmentUrl?: string | null;
  attachmentFileName?: string | null;
}

export function ProblemLivePreview({
  title,
  description,
  externalLink,
  attachmentUrl,
  attachmentFileName
}: ProblemLivePreviewProps) {
  const displayTitle = title.trim() || "Tên đề thi";

  return (
    <div className="flex h-full min-h-[20rem] flex-col rounded-xl border border-outline-variant bg-surface-container-low">
      <div className="flex items-center gap-sm border-b border-outline-variant/40 px-md py-sm">
        <span className="material-symbols-outlined text-base text-outline-variant">visibility</span>
        <span className="font-label-sm normal-case text-on-surface-variant">Xem trước — giao diện thí sinh</span>
      </div>
      <div className="flex-1 space-y-md overflow-y-auto p-md">
        <div>
          <p className="font-label-sm text-on-surface-variant">Tiêu đề đề thi</p>
          <h3 className="font-headline-sm text-on-surface">{displayTitle}</h3>
        </div>
        <ProblemContentView
          description={description}
          externalLink={externalLink.trim() || null}
          attachmentUrl={attachmentUrl}
          attachmentFileName={attachmentFileName}
          previewMode
        />
      </div>
    </div>
  );
}
