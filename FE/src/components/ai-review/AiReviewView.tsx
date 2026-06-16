import { Badge } from "../ui/Badge";
import { AiReviewRubricView } from "./AiReviewRubricView";
import type { AiReviewResponse } from "../../services/aiReviewApi";
import { formatAiReviewFailure, parseJsonList } from "../../services/aiReviewApi";

function statusTone(status: AiReviewResponse["status"]) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  return "warning" as const;
}

function statusLabel(status: AiReviewResponse["status"]) {
  if (status === "COMPLETED") return "Hoàn tất";
  if (status === "FAILED") return "Lỗi";
  return "Đang xử lý";
}

function kindLabel(kind: AiReviewResponse["reviewKind"]) {
  if (kind === "TEAM_AGGREGATE") return "Tổng hợp đội";
  if (kind === "PER_PUSH") return "Theo push";
  return "Đánh giá";
}

interface AiReviewViewProps {
  review: AiReviewResponse | null;
  loading?: boolean;
  detailedRubric?: boolean;
}

export function AiReviewView({ review, loading = false, detailedRubric = false }: AiReviewViewProps) {
  if (loading) {
    return <p className="font-body-sm text-on-surface-variant">Đang tải đánh giá AI…</p>;
  }
  if (!review) {
    return (
      <p className="font-body-sm text-on-surface-variant">
        Chưa có đánh giá AI. Hệ thống tự quét mã nguồn theo chu kỳ (mặc định 5 phút) sau khi mã nguồn được cấp.
      </p>
    );
  }

  const issues = parseJsonList(review.issues);
  const suggestions = parseJsonList(review.suggestions);
  const isAggregate = review.reviewKind === "TEAM_AGGREGATE";

  return (
    <div className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-md">
      <div className="flex flex-wrap items-center gap-sm">
        <Badge tone={statusTone(review.status)}>{statusLabel(review.status)}</Badge>
        {review.reviewKind ? <Badge tone="active">{kindLabel(review.reviewKind)}</Badge> : null}
        {review.ragLevel ? <Badge tone="active">RAG: {review.ragLevel}</Badge> : null}
        {review.reviewScore != null ? (
          <span className="font-label-sm text-on-surface-variant">
            Điểm tham khảo: {Number(review.reviewScore).toFixed(0)}/100
          </span>
        ) : null}
      </div>

      {review.status === "FAILED" ? (
        <div className="rounded-lg border border-error/30 bg-error-container/20 p-sm">
          <p className="font-label-sm text-error">Đánh giá thất bại</p>
          <p className="mt-xs font-body-sm text-on-surface-variant">
            {formatAiReviewFailure(review.summary)}
          </p>
        </div>
      ) : null}

      {review.summary && review.status !== "FAILED" ? (
        <section>
          <h3 className="font-label-md text-on-surface">Tóm tắt</h3>
          <p className="mt-xs font-body-sm text-on-surface-variant whitespace-pre-wrap">{review.summary}</p>
        </section>
      ) : null}

      {isAggregate ? <AiReviewRubricView review={review} detailed={detailedRubric} /> : null}

      {issues.length > 0 ? (
        <section>
          <h3 className="font-label-md text-on-surface">Vấn đề / rủi ro</h3>
          <ul className="mt-xs list-disc space-y-xs pl-5 font-body-sm text-on-surface-variant">
            {issues.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {suggestions.length > 0 ? (
        <section>
          <h3 className="font-label-md text-on-surface">Gợi ý & câu hỏi phản biện</h3>
          <ul className="mt-xs list-disc space-y-xs pl-5 font-body-sm text-on-surface-variant">
            {suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {review.githubIssueUrl ? (
        <p className="font-body-sm">
          <a
            href={review.githubIssueUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            Xem GitHub Issue báo cáo thay đổi quan trọng
          </a>
        </p>
      ) : null}

      <p className="font-body-sm text-on-surface-variant">
        {review.reviewedAt
          ? `Cập nhật lúc ${new Date(review.reviewedAt).toLocaleString("vi-VN")}`
          : "Chưa có thời điểm đánh giá"}
        {review.commitSha ? ` · commit ${review.commitSha.slice(0, 7)}` : ""}
      </p>
    </div>
  );
}
