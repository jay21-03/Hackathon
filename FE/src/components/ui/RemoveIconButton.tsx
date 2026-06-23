import { Icon } from "./Icon";

interface RemoveIconButtonProps {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}

export function RemoveIconButton({
  label,
  disabled = false,
  onClick,
  type = "button",
  className = ""
}: RemoveIconButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex size-7 items-center justify-center rounded-md text-on-surface-variant hover:bg-error-container/40 hover:text-error disabled:opacity-50 ${className}`}
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon name="close" className="text-[16px]" />
    </button>
  );
}
