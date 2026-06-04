import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function AnnouncementPage() {
  return (
    <FeatureUnavailable
      eyebrow="Truyen thong"
      title="Thong bao chung"
      description="Gui thong bao toi participant/mentor/judge."
      beNote="BE phase 9: POST /api/v1/announcements."
    />
  );
}
