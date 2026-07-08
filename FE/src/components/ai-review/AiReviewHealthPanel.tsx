import { Badge } from "../ui/Badge";
import type { AiReviewHealthResponse } from "../../services/aiReviewApi";

interface AiReviewHealthPanelProps {
  health: AiReviewHealthResponse | null;
  loading?: boolean;
}

export function AiReviewHealthPanel({ health, loading = false }: AiReviewHealthPanelProps) {
  if (loading) {
    return (
      <section className="rounded-xl border border-outline-variant bg-surface-container p-md font-body-sm text-on-surface-variant">
        Đang tải tiến độ AI Review...
      </section>
    );
  }
  if (!health) return null;

  const ok = health.teamsWithFailedReview === 0 && health.aiConfigured;
  const waitingCount = Math.max(
    health.teamsWithRepository - health.teamsWithCompletedReview - health.teamsWithFailedReview,
    0
  );

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container p-md">
      <div className="flex flex-wrap items-center gap-sm">
        <h2 className="font-label-md text-on-surface">Tiến độ AI Review</h2>
        <Badge tone={ok ? "success" : "warning"}>{ok ? "Ổn định" : "Cần chú ý"}</Badge>
        {!health.aiConfigured ? <Badge tone="danger">Chưa cấu hình AI</Badge> : null}
      </div>
      <dl className="mt-sm grid gap-sm font-body-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-on-surface-variant">Đội có repo</dt>
          <dd className="font-label-sm text-on-surface">{health.teamsWithRepository}</dd>
        </div>
        <div>
          <dt className="text-on-surface-variant">Hoàn tất</dt>
          <dd className="font-label-sm text-on-surface">{health.teamsWithCompletedReview}</dd>
        </div>
        <div>
          <dt className="text-on-surface-variant">Chưa hoàn tất</dt>
          <dd className="font-label-sm text-on-surface">{waitingCount}</dd>
        </div>
        <div>
          <dt className="text-on-surface-variant">Lỗi đội</dt>
          <dd className="font-label-sm text-on-surface">{health.teamsWithFailedReview}</dd>
        </div>
      </dl>
      {health.recommendation ? (
        <p className="mt-xs font-body-sm text-on-surface">{health.recommendation}</p>
      ) : null}
    </section>
  );
}
