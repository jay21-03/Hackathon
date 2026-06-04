import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function MentorAiReviewPage() {
  return (
    <FeatureUnavailable
      eyebrow="AI"
      title="Đánh giá AI (mentor)"
      description="Xem cảnh báo AI cho đội phụ trách."
      beNote="BE phase 10: GET /api/v1/ai-reviews/mentor."
    />
  );
}
