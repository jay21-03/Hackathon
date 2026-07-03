import { Badge } from "../ui/Badge";
import type { AiReviewResponse } from "../../services/aiReviewApi";

interface AiReviewHistoryPanelProps {
  reviews: AiReviewResponse[];
  loading?: boolean;
  selectedId?: number | null;
  onSelect?: (review: AiReviewResponse) => void;
}

function kindShort(kind: AiReviewResponse["reviewKind"]) {
  if (kind === "TEAM_AGGREGATE") return "Tổng hợp";
  if (kind === "PER_PUSH") return "Cập nhật";
  return "Review";
}

function statusShort(status: AiReviewResponse["status"]) {
  if (status === "LLM_STARTED") return "Đang xử lý";
  return status;
}

export function AiReviewHistoryPanel({
  reviews,
  loading = false,
  selectedId,
  onSelect
}: AiReviewHistoryPanelProps) {
  if (loading) {
    return <p className="font-body-sm text-on-surface-variant">Đang tải lịch sử…</p>;
  }
  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="space-y-sm rounded-xl border border-outline-variant bg-surface-container-low p-md">
      <h3 className="font-label-md text-on-surface">Lịch sử đánh giá ({reviews.length})</h3>
      <ul className="max-h-48 space-y-xs overflow-y-auto">
        {reviews.map((item) => {
          const active = selectedId != null && item.id === selectedId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect?.(item)}
                className={`flex w-full items-center justify-between gap-sm rounded-lg px-sm py-xs text-left font-body-sm ${
                  active ? "bg-surface-container-high" : "hover:bg-surface-container"
                }`}
              >
                <span className="text-on-surface">
                  {kindShort(item.reviewKind)} · {statusShort(item.status)}
                </span>
                <span className="shrink-0 text-on-surface-variant">
                  {item.reviewedAt ? new Date(item.reviewedAt).toLocaleString("vi-VN") : "—"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {reviews.some((r) => r.githubIssueUrl) ? (
        <Badge tone="warning">Có GitHub Issue trong lịch sử</Badge>
      ) : null}
    </section>
  );
}
