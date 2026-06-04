import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function DisqualificationPage() {
  return (
    <FeatureUnavailable
      eyebrow="Ky luat"
      title="Xu ly vi pham"
      description="Ghi nhan va xu ly tru diem / loai doi."
      beNote="BE: API violations/disqualifications (chua co trong phase 1-6)."
    />
  );
}
