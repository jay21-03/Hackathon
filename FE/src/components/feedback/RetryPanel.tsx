import { Button } from "../ui/Button";

interface RetryPanelProps {
  message: string;
  onRetry?: () => void;
}

export function RetryPanel({ message, onRetry }: RetryPanelProps) {
  return (
    <div className="rounded-xl border border-error-container bg-error-container/30 p-md">
      <p className="font-body-sm text-on-surface">{message}</p>
      {onRetry ? (
        <Button type="button" variant="secondary" className="mt-sm" onClick={onRetry}>
          Thử lại
        </Button>
      ) : null}
    </div>
  );
}
