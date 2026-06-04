import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function ScoringProgressPage() {
  return (
    <FeatureUnavailable
      eyebrow="Chấm điểm"
      title="Tiến độ chấm"
      description="Theo dõi giám khảo đã chấm bao nhiêu đội."
      beNote="BE phase 7: GET /api/v1/scoring/progress theo round/board."
    />
  );
}
