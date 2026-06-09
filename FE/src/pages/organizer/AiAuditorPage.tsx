import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function AiAuditorPage() {
  return (
    <FeatureUnavailable
      homeTo="/organizer/dashboard"
      eyebrow="AI"
      title="Hang doi kiem tra AI"
      description="Duyệt và xử lý cảnh báo AI."
    />
  );
}
