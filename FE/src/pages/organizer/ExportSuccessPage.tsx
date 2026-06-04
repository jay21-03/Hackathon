import { FeatureUnavailable } from "../../components/feedback/FeatureUnavailable";

export function ExportSuccessPage() {
  return (
    <FeatureUnavailable
      eyebrow="Xuat dữ liệu"
      title="Xuất kết quả"
      description="Tải file kết quả và bảng xếp hạng."
      beNote="BE phase 8: GET /api/v1/exports/results (CSV/Excel)."
    />
  );
}
