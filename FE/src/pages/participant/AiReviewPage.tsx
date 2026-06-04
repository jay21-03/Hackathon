import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function AiReviewPage() {
  return (
    <FeatureUnavailable
      eyebrow="AI"
      title="Đánh giá AI"
      description="Xem kết quả đánh giá AI cho bài nộp."
      beNote="BE phase 10: GET /api/v1/ai-reviews/me."
    />
  );
}
