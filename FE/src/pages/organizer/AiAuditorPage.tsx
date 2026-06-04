import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function AiAuditorPage() {
  return (
    <FeatureUnavailable
      eyebrow="AI"
      title="Hang doi kiem tra AI"
      description="Duyệt và xử lý cảnh báo AI."
      beNote="BE phase 10: GET /api/v1/ai-reviews/queue, PATCH trạng thái."
    />
  );
}
