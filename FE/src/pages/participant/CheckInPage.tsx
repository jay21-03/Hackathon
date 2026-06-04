import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function CheckInPage() {
  return (
    <FeatureUnavailable
      eyebrow="Check-in"
      title="Check-in ngày thi"
      description="Xác nhận mặt hoặc QR check-in."
      beNote="BE phase 9: POST /api/v1/check-ins/me."
    />
  );
}
