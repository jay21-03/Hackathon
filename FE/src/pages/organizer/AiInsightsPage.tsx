import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function AiInsightsPage() {
  return (
    <FeatureUnavailable
      eyebrow="AI"
      title="Nhan xet AI"
      description="Tong hop nhan xet AI theo doi."
      beNote="BE phase 10: GET /api/v1/ai-reviews/insights."
    />
  );
}
