import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function CheckInPage() {
  return (
    <FeatureUnavailable
      eyebrow="Check-in"
      title="Check-in ngay thi"
      description="Xac nhan mat hoac QR check-in."
      beNote="BE phase 9: POST /api/v1/check-ins/me."
    />
  );
}
