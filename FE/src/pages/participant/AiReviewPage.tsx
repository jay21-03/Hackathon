import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function AiReviewPage() {
  return (
    <FeatureUnavailable
      eyebrow="AI"
      title="Danh gia AI"
      description="Xem ket qua danh gia AI cho bai nop."
      beNote="BE phase 10: GET /api/v1/ai-reviews/me."
    />
  );
}
