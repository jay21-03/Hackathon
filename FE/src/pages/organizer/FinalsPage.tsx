import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function FinalsPage() {
  return (
    <FeatureUnavailable
      homeTo="/organizer/dashboard"
      eyebrow="Chung kết"
      title="Vòng chung kết"
      description="Chọn đội vào vòng chung kết và quản lý bảng CK."
    />
  );
}
