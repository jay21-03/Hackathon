import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function ResultsPortalPage() {
  return (
    <FeatureUnavailable
      eyebrow="Cong khai"
      title="Cong bo ket qua"
      description="Xem ket qua da cong bo cua cuoc thi."
      beNote="BE phase 8: GET /api/v1/public/events/{id}/results."
    />
  );
}
