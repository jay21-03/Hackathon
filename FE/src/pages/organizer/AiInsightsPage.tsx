import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function AiInsightsPage() {
  return (
    <FeatureUnavailable
      homeTo="/organizer/dashboard"
      eyebrow="AI"
      title="Nhận xét AI"
      description="Tổng hợp nhận xét AI theo đội."
    />
  );
}
