import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function NotificationCenterPage() {
  return (
    <FeatureUnavailable
      eyebrow="Thông báo"
      title="Trung tâm thông báo"
      description="Lịch sử và trạng thái gửi thông báo."
      beNote="BE phase 9: GET/POST /api/v1/notifications."
    />
  );
}
