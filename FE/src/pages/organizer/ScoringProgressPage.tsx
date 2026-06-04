import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function ScoringProgressPage() {
  return (
    <FeatureUnavailable
      eyebrow="Cham diem"
      title="Tien do cham"
      description="Theo doi giam khao da cham bao nhieu doi."
      beNote="BE phase 7: GET /api/v1/scoring/progress theo round/board."
    />
  );
}
