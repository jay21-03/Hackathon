import { useState, type ReactNode } from "react";
import { teamStatusRejectSchema } from "../../domain/schemas";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

interface ReasonConfirmActionProps {
  title: string;
  message: string;
  confirmLabel: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  children: ReactNode;
  onConfirm: (reason: string) => void;
}

export function ReasonConfirmAction({
  title,
  message,
  confirmLabel,
  reasonLabel = "Lý do",
  reasonPlaceholder = "Nhập lý do cụ thể…",
  children,
  onConfirm
}: ReasonConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setReason("");
    setError(null);
  }

  function handleConfirm() {
    const parsed = teamStatusRejectSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Cần nhập lý do.");
      return;
    }
    onConfirm(parsed.data.reason);
    close();
  }

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") setOpen(true);
        }}
        className="contents"
      >
        {children}
      </span>
      {open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container p-lg shadow-2xl">
            <div className="mb-md flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-container text-on-error-container">
                <Icon name="warning" filled />
              </div>
              <h2 className="font-headline-sm text-on-surface">{title}</h2>
            </div>
            <p className="font-body-sm text-on-surface-variant">{message}</p>
            <label className="mt-md grid gap-xs font-label-md text-on-surface">
              <span>
                {reasonLabel}
                <span className="text-error">*</span>
              </span>
              <textarea
                className="min-h-[5rem] w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError(null);
                }}
                placeholder={reasonPlaceholder}
                rows={3}
              />
              {error ? <span className="font-body-sm text-error">{error}</span> : null}
            </label>
            <div className="mt-lg flex justify-end gap-sm">
              <Button variant="ghost" onClick={close}>
                Hủy
              </Button>
              <Button
                variant="primary"
                data-testid="reason-confirm-submit"
                onClick={handleConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
