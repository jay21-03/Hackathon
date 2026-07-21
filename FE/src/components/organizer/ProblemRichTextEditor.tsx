import { lazy, Suspense } from "react";

interface ProblemRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

const ProblemRichTextEditorImpl = lazy(() => import("./ProblemRichTextEditorImpl"));

export function ProblemRichTextEditor({ value, onChange, disabled }: ProblemRichTextEditorProps) {
  return (
    <div className="problem-editor rounded-lg border border-outline-variant bg-surface-container-lowest [&_.ck-editor__editable]:min-h-48">
      <Suspense fallback={<div className="min-h-48 p-md font-body-sm text-on-surface-variant">Đang tải trình soạn thảo...</div>}>
        <ProblemRichTextEditorImpl value={value} onChange={onChange} disabled={disabled} />
      </Suspense>
    </div>
  );
}

export type { ProblemRichTextEditorProps };
