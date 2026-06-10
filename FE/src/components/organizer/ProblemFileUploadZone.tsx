import { useRef, useState } from "react";
import { Button } from "../ui/Button";
import { deleteProblemAttachment, uploadProblemAttachment } from "../../services/fileUploadApi";
import {
  PROBLEM_ATTACHMENT_EXTENSIONS,
  PROBLEM_ATTACHMENT_MAX_BYTES,
  validateProblemAttachmentFile
} from "../../domain/schemas";
import { resolveApiError } from "../../utils/apiError";

const ACCEPT = ".pdf,.docx,.zip";
const MAX_SIZE_MB = PROBLEM_ATTACHMENT_MAX_BYTES / (1024 * 1024);

interface ProblemFileUploadZoneProps {
  eventId: number;
  attachmentUrl?: string | null;
  fileName?: string | null;
  onUploaded: (url: string, fileName: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ProblemFileUploadZone({
  eventId,
  attachmentUrl,
  fileName,
  onUploaded,
  onClear,
  disabled
}: ProblemFileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleClear() {
    if (!attachmentUrl) {
      onClear();
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await deleteProblemAttachment(eventId, attachmentUrl);
      onClear();
    } catch (err) {
      setError(resolveApiError(err, "Không gỡ được tệp đính kèm."));
    } finally {
      setUploading(false);
    }
  }

  async function handleFile(file: File) {
    setError(null);
    const validationError = validateProblemAttachmentFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    try {
      if (attachmentUrl) {
        await deleteProblemAttachment(eventId, attachmentUrl);
      }
      const result = await uploadProblemAttachment(eventId, file);
      onUploaded(result.url, result.fileName);
    } catch (err) {
      setError(resolveApiError(err, "Không tải được tệp lên."));
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  if (attachmentUrl) {
    return (
      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md space-y-sm">
        <div className="flex items-start justify-between gap-md">
          <div className="min-w-0">
            <p className="font-label-sm text-on-surface-variant">Tệp đính kèm</p>
            <p className="font-body-sm text-on-surface truncate">{fileName ?? attachmentUrl}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled || uploading}
            onClick={() => void handleClear()}
          >
            Gỡ tệp
          </Button>
        </div>
        <p className="font-body-sm text-on-surface-variant">
          Kéo thả tệp mới hoặc bấm bên dưới để thay thế.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onInputChange}
          disabled={disabled || uploading}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Đang tải lên…" : "Thay tệp khác"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-sm">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click();
        }}
        className={[
          "cursor-pointer rounded-lg border-2 border-dashed p-xl text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-outline-variant bg-surface-container-low hover:border-primary/60"
        ].join(" ")}
      >
        <span className="material-symbols-outlined mb-sm block text-4xl text-outline-variant">upload_file</span>
        <p className="font-body-md text-on-surface">
          {uploading ? "Đang tải lên…" : "Kéo thả PDF, DOCX hoặc ZIP"}
        </p>
        <p className="mt-xs font-body-sm text-on-surface-variant">
          hoặc bấm để chọn tệp ({PROBLEM_ATTACHMENT_EXTENSIONS.join(", ").toUpperCase()}, tối đa {MAX_SIZE_MB}MB)
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onInputChange}
        disabled={disabled || uploading}
      />
      {error ? <p className="font-body-sm text-error">{error}</p> : null}
    </div>
  );
}
