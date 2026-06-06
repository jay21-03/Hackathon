import { ButtonLink } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";

interface FeatureUnavailableProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function FeatureUnavailable({ eyebrow, title, description }: FeatureUnavailableProps) {
  return (
    <div className="space-y-lg">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <EmptyState
        icon="construction"
        title="Chưa khả dụng"
        description="Chức năng này sẽ được bổ sung trong bản cập nhật sau."
        action={
          <ButtonLink to="/organizer/dashboard" variant="secondary" className="mt-md">
            Về tổng quan
          </ButtonLink>
        }
      />
    </div>
  );
}
