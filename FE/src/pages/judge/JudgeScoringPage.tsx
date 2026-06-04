import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function JudgeScoringPage() {
  return (
    <FeatureUnavailable
      eyebrow="Cham diem"
      title="Phieu cham"
      description="Cham diem theo rubric cho doi duoc phan."
      beNote="BE phase 7: GET/PUT /api/v1/score-sheets."
    />
  );
}
