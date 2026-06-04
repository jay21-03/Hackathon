import { Badge } from "./Badge";
import { ModuleSkeleton } from "./ModuleSkeleton";
import type { RoundCountdownResponse } from "../../services/contestApi";

interface RoundCountdownProps {
  roundId: number | null;
  countdown?: RoundCountdownResponse | null;
  loading?: boolean;
  className?: string;
}

function formatRemaining(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}g ${m}p ${s}s`;
  if (m > 0) return `${m}p ${s}s`;
  return `${s}s`;
}

const statusLabel: Record<RoundCountdownResponse["status"], string> = {
  NOT_STARTED: "Chưa bắt đầu",
  RUNNING: "Đang diễn ra",
  ENDED: "Đã kết thúc"
};

const statusTone: Record<RoundCountdownResponse["status"], "warning" | "success" | "neutral"> = {
  NOT_STARTED: "warning",
  RUNNING: "success",
  ENDED: "neutral"
};

export function RoundCountdown({ roundId, countdown, loading, className = "" }: RoundCountdownProps) {
  if (!roundId) return null;
  if (loading) return <ModuleSkeleton rows={1} />;
  if (!countdown) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-sm rounded-xl border border-outline-variant bg-surface-container px-md py-sm ${className}`}
    >
      <span className="font-label-sm normal-case text-on-surface-variant">Vòng thi</span>
      <Badge tone={statusTone[countdown.status]}>{statusLabel[countdown.status]}</Badge>
      {countdown.status === "RUNNING" ? (
        <span className="font-mono-data text-on-surface">Còn {formatRemaining(countdown.remainingSeconds)}</span>
      ) : null}
    </div>
  );
}
