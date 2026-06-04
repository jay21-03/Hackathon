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
        title="Chua ket noi API"
        description={
          beNote ??
          "Chuc nang nay can backend bo sung. Giao dien da san sang, du lieu se hien thi khi API duoc trien khai."
        }
      />
    </div>
  );
}
