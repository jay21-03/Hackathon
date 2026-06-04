import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function RubricSetupPage() {
  return (
    <FeatureUnavailable
      eyebrow="Tieu chi cham"
      title="Cau hinh rubric"
      description="Tao va chinh sua tieu chi cham diem cho giam khao."
      beNote="BE phase 7: POST/GET /api/v1/rubrics, gan rubric theo round/board."
    />
  );
}
