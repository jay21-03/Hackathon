import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function SubmissionPage() {
  return (
    <FeatureUnavailable
      eyebrow="Bài nộp"
      title="Nộp bài"
      description="Tải lên và gửi bài nộp theo deadline."
      beNote="BE phase 7: POST /api/v1/submissions, GET trạng thái nop."
    />
  );
}
