interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const normalized = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-xs">
      {label && (
        <div className="flex items-center justify-between font-label-sm normal-case text-on-surface-variant">
          <span>{label}</span>
          <span>{normalized}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-surface-variant">
        <div className="h-full rounded-full bg-secondary" style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
}
