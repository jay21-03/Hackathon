import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function CheckInManagementPage() {
  return (
    <FeatureUnavailable
      eyebrow="Check-in"
      title="Quan ly check-in"
      description="Theo doi check-in theo doi va bang thi."
      beNote="BE phase 9: POST /api/v1/check-ins, GET danh sach theo event/board."
    />
  );
}
