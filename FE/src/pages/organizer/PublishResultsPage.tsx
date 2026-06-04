import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function PublishResultsPage() {
  return (
    <FeatureUnavailable
      eyebrow="Công bố"
      title="Công bố kết quả"
      description="Xem trước và công bố kết quả chính thức."
      beNote="BE phase 8: POST /api/v1/results/publish."
    />
  );
}
