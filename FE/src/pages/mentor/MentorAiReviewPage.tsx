import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function MentorAiReviewPage() {
  return (
    <FeatureUnavailable
      homeTo="/mentor/dashboard"
      eyebrow="AI"
      title="Đánh giá AI (mentor)"
      description="Xem cảnh báo AI cho đội phụ trách."
    />
  );
}
