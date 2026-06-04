import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function CheckInManagementPage() {
  return (
    <FeatureUnavailable
      eyebrow="Check-in"
      title="Quản lý check-in"
      description="Theo dõi check-in theo đội và bảng thi."
      beNote="BE phase 9: POST /api/v1/check-ins, GET danh sach theo event/board."
    />
  );
}
