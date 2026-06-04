import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function RankingPage() {
  return (
    <FeatureUnavailable
      eyebrow="Kết quả"
      title="Bảng xếp hạng"
      description="Xếp hạng theo điểm và tiêu chí phụ."
      beNote="BE phase 8: GET /api/v1/rankings, tinh diem tu score sheets."
    />
  );
}
