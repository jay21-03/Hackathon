import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function RankingPage() {
  return (
    <FeatureUnavailable
      eyebrow="Ket qua"
      title="Bang xep hang"
      description="Xep hang theo diem va tieu chi phu."
      beNote="BE phase 8: GET /api/v1/rankings, tinh diem tu score sheets."
    />
  );
}
