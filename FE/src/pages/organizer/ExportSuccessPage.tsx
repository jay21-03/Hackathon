import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function ExportSuccessPage() {
  return (
    <FeatureUnavailable
      eyebrow="Xuat du lieu"
      title="Xuat ket qua"
      description="Tai file ket qua va bang xep hang."
      beNote="BE phase 8: GET /api/v1/exports/results (CSV/Excel)."
    />
  );
}
