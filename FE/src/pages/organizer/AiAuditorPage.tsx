import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function AiAuditorPage() {
  return (
    <FeatureUnavailable
      eyebrow="AI"
      title="Hang doi kiem tra AI"
      description="Duyet va xu ly canh bao AI."
      beNote="BE phase 10: GET /api/v1/ai-reviews/queue, PATCH trang thai."
    />
  );
}
