import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg" | "xl" | "2xl";
}

const sizeClass = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl"
};

const heightClass = {
  md: "max-h-[min(90vh,720px)]",
  lg: "max-h-[min(90vh,720px)]",
  xl: "max-h-[min(92vh,860px)]",
  "2xl": "max-h-[min(92vh,920px)]"
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, title, onClose, children, size = "lg" }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusables = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null
      );
      if (focusables.length === 0) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`flex w-full flex-col rounded-xl border border-outline-variant bg-surface-container shadow-2xl ${sizeClass[size]} ${heightClass[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-sm border-b border-outline-variant px-lg py-md">
          <h2 id="modal-title" className="font-headline-sm text-on-surface">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Đóng"
            icon={<Icon name="close" className="text-[20px]" />}
            onClick={onClose}
          >
            <span className="sr-only">Đóng</span>
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-lg py-md">{children}</div>
      </div>
    </div>
  );
}
