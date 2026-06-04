import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function NotificationCenterPage() {
  return (
    <FeatureUnavailable
      eyebrow="Thong bao"
      title="Trung tam thong bao"
      description="Lich su va trang thai gui thong bao."
      beNote="BE phase 9: GET/POST /api/v1/notifications."
    />
  );
}
