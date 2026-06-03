import { useState, type ReactNode } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

interface ConfirmActionProps {
  title: string;
  message: string;
  confirmLabel: string;
  children: ReactNode;
  onConfirm: () => void;
}

export function ConfirmAction({
  title,
  message,
  confirmLabel,
  children,
  onConfirm
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);

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
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container p-lg shadow-2xl">
            <div className="mb-md flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-container text-on-error-container">
                <Icon name="warning" filled />
              </div>
              <h2 className="font-headline-sm text-on-surface">{title}</h2>
            </div>
            <p className="font-body-sm text-on-surface-variant">{message}</p>
            <div className="mt-lg flex justify-end gap-sm">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Huy
              </Button>
              <Button
                variant="primary"
                data-testid="confirm-action-submit"
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
