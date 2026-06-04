import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function JudgeScoringPage() {
  return (
    <FeatureUnavailable
      eyebrow="Chấm điểm"
      title="Phiếu chấm"
      description="Chấm điểm theo rubric cho đội được phân."
      beNote="BE phase 7: GET/PUT /api/v1/score-sheets."
    />
  );
}
