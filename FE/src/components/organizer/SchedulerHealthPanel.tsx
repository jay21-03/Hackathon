import { useQuery } from "@tanstack/react-query";
import { Badge } from "../ui/Badge";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { fetchSchedulerHealth } from "../../services/platformHealthApi";
import { resolveApiError } from "../../utils/apiError";

function statusLabel(enabled: boolean) {
  return enabled ? "Bật" : "Tắt";
}

function statusTone(enabled: boolean): "success" | "warning" {
  return enabled ? "success" : "warning";
}

export function SchedulerHealthPanel() {
  const query = useQuery({
    queryKey: ["platform", "scheduler-health"],
    queryFn: fetchSchedulerHealth,
    staleTime: 60_000
  });

  if (query.isLoading) {
    return <ModuleSkeleton rows={2} />;
  }

  if (query.isError) {
    return (
      <p className="rounded-lg border border-error/40 bg-error-container/30 p-md font-body-sm text-on-surface">
        {resolveApiError(query.error, "Không tải trạng thái scheduler.")}
      </p>
    );
  }

  const health = query.data!;

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container p-md space-y-sm">
      <h3 className="font-title-sm text-on-surface">Scheduler nền tảng</h3>
      <p className="font-body-sm text-on-surface-variant">
        Trạng thái job nội bộ (GitHub repo, AI review, vòng đời cuộc thi). Khi tắt, kiểm tra n8n bridge.
      </p>
      <ul className="flex flex-wrap gap-sm font-body-sm">
        <li className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-sm py-xs">
          GitHub repo
          <Badge tone={statusTone(health.githubSchedulerEnabled)}>
            {statusLabel(health.githubSchedulerEnabled)}
          </Badge>
        </li>
        <li className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-sm py-xs">
          AI review
          <Badge tone={statusTone(health.aiReviewSchedulerEnabled)}>
            {statusLabel(health.aiReviewSchedulerEnabled)}
          </Badge>
        </li>
        <li className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-sm py-xs">
          Vòng đời cuộc thi
          <Badge tone={statusTone(health.eventLifecycleSchedulerEnabled)}>
            {statusLabel(health.eventLifecycleSchedulerEnabled)}
          </Badge>
        </li>
      </ul>
      {health.recommendation ? (
        <p className="font-body-sm text-on-surface-variant">{health.recommendation}</p>
      ) : null}
    </section>
  );
}
