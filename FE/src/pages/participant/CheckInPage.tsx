import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function CheckInPage() {
  return (
    <FeatureUnavailable
      eyebrow="Check-in"
      title="Check-in ngày thi"
      description="Xác nhận mặt hoặc QR check-in."
      homeTo="/me"
    />
  );
}
