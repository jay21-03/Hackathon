import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function MentorAiReviewPage() {
  return (
    <FeatureUnavailable
      eyebrow="AI"
      title="Danh gia AI (mentor)"
      description="Xem canh bao AI cho doi phu trach."
      beNote="BE phase 10: GET /api/v1/ai-reviews/mentor."
    />
  );
}
