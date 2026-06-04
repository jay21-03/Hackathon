import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function AnnouncementPage() {
  return (
    <FeatureUnavailable
      eyebrow="Truyền thông"
      title="Thông báo chung"
      description="Gửi thông báo tới participant/mentor/judge."
      beNote="BE phase 9: POST /api/v1/announcements."
    />
  );
}
