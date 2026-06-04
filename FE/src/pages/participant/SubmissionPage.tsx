import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function SubmissionPage() {
  return (
    <FeatureUnavailable
      eyebrow="Bai nop"
      title="Nop bai"
      description="Tai len va gui bai nop theo deadline."
      beNote="BE phase 7: POST /api/v1/submissions, GET trang thai nop."
    />
  );
}
