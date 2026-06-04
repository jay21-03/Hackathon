import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function RubricSetupPage() {
  return (
    <FeatureUnavailable
      eyebrow="Tiêu chí chấm"
      title="Cau hinh rubric"
      description="Tạo và chỉnh sửa tiêu chí chấm điểm cho giám khảo."
      beNote="BE phase 7: POST/GET /api/v1/rubrics, gan rubric theo round/board."
    />
  );
}
