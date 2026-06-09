import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function CheckInManagementPage() {
  return (
    <FeatureUnavailable
      homeTo="/organizer/dashboard"
      eyebrow="Check-in"
      title="Quản lý check-in"
      description="Theo dõi check-in theo đội và bảng thi."
    />
  );
}
