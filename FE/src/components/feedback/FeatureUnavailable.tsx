import { ButtonLink } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";

interface FeatureUnavailableProps {
  eyebrow: string;
  title: string;
  description: string;
  beNote?: string;
}

export function FeatureUnavailable({ eyebrow, title, description, beNote }: FeatureUnavailableProps) {
  return (
    <div className="space-y-lg">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <EmptyState
        icon="construction"
        title="Chưa kết nối API"
        description={
          beNote ??
          "Chức năng này cần backend bổ sung. Giao diện đã sẵn sàng — dữ liệu sẽ hiển thị khi API được triển khai (phase 7+)."
        }
        action={
          <ButtonLink to="/organizer/dashboard" variant="secondary" className="mt-md">
            Về tổng quan
          </ButtonLink>
        }
      />
    </div>
  );
}
