import { Icon } from "../ui/Icon";
import type { TeamScoreStatusInfo } from "./judgeTeamScoreStatus";

const toneClasses: Record<TeamScoreStatusInfo["tone"], string> = {
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100",
  warning:
    "border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100",
  neutral: "border-outline-variant bg-surface-container-high text-on-surface",
  active: "border-primary/30 bg-primary-fixed text-on-primary-fixed",
  ai: "border-violet-300 bg-violet-50 text-violet-950",
  danger: "border-red-300 bg-red-50 text-red-950 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100"
};

interface JudgeTeamScoreStatusBannerProps {
  status: TeamScoreStatusInfo;
  compact?: boolean;
}

export function JudgeTeamScoreStatusBanner({ status, compact = false }: JudgeTeamScoreStatusBannerProps) {
  return (
    <div className={`rounded-xl border p-md ${toneClasses[status.tone]}`}>
      <div className="flex items-start gap-sm">
        <Icon
          name={status.icon}
          className={`mt-0.5 shrink-0 ${compact ? "text-[20px]" : "text-[24px]"}`}
        />
        <div className="min-w-0 space-y-0.5">
          <p className={compact ? "font-label-md" : "font-headline-sm"}>{status.label}</p>
          {!compact ? (
            <p className="font-body-sm opacity-90">{status.description}</p>
          ) : (
            <p className="font-body-sm opacity-80">{status.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
