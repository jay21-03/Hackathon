import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function PublishResultsPage() {
  return (
    <FeatureUnavailable
      eyebrow="Cong bo"
      title="Cong bo ket qua"
      description="Xem truoc va cong bo ket qua chinh thuc."
      beNote="BE phase 8: POST /api/v1/results/publish."
    />
  );
}
