import { useQuery } from "@tanstack/react-query";
import { Badge } from "../ui/Badge";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { fetchSchedulerHealth } from "../../services/platformHealthApi";
import { resolveApiError } from "../../utils/apiError";

function statusLabel(enabled: boolean, labels = { on: "Bật", off: "Tắt" }) {
  return enabled ? labels.on : labels.off;
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
    <section className="space-y-sm rounded-xl border border-outline-variant bg-surface-container p-md">
      <h3 className="font-title-sm text-on-surface">Scheduler nền tảng</h3>
      <p className="font-body-sm text-on-surface-variant">
        Tách rõ job nội bộ, webhook/bridge và email thật để tránh hiểu nhầm khi một đường xử lý đang tắt.
      </p>
      <ul className="flex flex-wrap gap-sm font-body-sm">
        <li className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-sm py-xs">
          GitHub scheduler
          <Badge tone={statusTone(health.githubSchedulerEnabled)}>
            {statusLabel(health.githubSchedulerEnabled)}
          </Badge>
        </li>
        <li className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-sm py-xs">
          GitHub webhook
          <Badge tone={statusTone(health.githubWebhookConfigured)}>
            {statusLabel(health.githubWebhookConfigured, { on: "Đã cấu hình", off: "Thiếu secret" })}
          </Badge>
        </li>
        <li className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-sm py-xs">
          AI scheduler nội bộ
          <Badge tone={statusTone(health.aiReviewSchedulerEnabled)}>
            {statusLabel(health.aiReviewSchedulerEnabled)}
          </Badge>
        </li>
        <li className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-sm py-xs">
          AI webhook push
          <Badge tone={statusTone(health.aiReviewWebhookEnabled)}>
            {statusLabel(health.aiReviewWebhookEnabled)}
          </Badge>
        </li>
        <li className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-sm py-xs">
          n8n bridge
          <Badge tone={statusTone(health.n8nWebhookConfigured)}>
            {statusLabel(health.n8nWebhookConfigured, { on: "Đã cấu hình", off: "Chưa cấu hình" })}
          </Badge>
        </li>
        <li className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-sm py-xs">
          Vòng đời cuộc thi
          <Badge tone={statusTone(health.eventLifecycleSchedulerEnabled)}>
            {statusLabel(health.eventLifecycleSchedulerEnabled)}
          </Badge>
        </li>
        <li className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-sm py-xs">
          Email
          <Badge tone={health.mailEnabled ? "success" : "warning"}>
            {health.mailEnabled ? "Gửi thật" : "Mock/log"}
          </Badge>
        </li>
      </ul>
      {health.recommendation ? (
        <p className="font-body-sm text-on-surface-variant">{health.recommendation}</p>
      ) : null}
    </section>
  );
}
