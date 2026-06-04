import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function ResultsPortalPage() {
  return (
    <FeatureUnavailable
      eyebrow="Cong khai"
      title="Công bố kết quả"
      description="Xem kết quả đã công bố của cuộc thi."
      beNote="BE phase 8: GET /api/v1/public/events/{id}/results."
    />
  );
}
