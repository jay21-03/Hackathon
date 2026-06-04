import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function AiInsightsPage() {
  return (
    <FeatureUnavailable
      eyebrow="AI"
      title="Nhận xét AI"
      description="Tổng hợp nhận xét AI theo đội."
      beNote="BE phase 10: GET /api/v1/ai-reviews/insights."
    />
  );
}
