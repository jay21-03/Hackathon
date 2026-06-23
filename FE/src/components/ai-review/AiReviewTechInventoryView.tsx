import type { InventoryExhaustive, TechStackGroup } from "../../services/aiReviewApi";

export const TECH_STACK_LABELS: Record<keyof TechStackGroup, string> = {
  frameworks: "Framework",
  llm_models: "Mô hình LLM",
  vector_db: "Cơ sở vector",
  agent_frameworks: "Framework agent",
  third_party_tools: "Công cụ bên thứ ba"
};

export const INVENTORY_LABELS: Record<keyof InventoryExhaustive, string> = {
  languages: "Ngôn ngữ",
  frameworks_libraries: "Framework / thư viện",
  data_stores: "Kho dữ liệu",
  ai_ml_stack: "Ngăn xếp AI / ML",
  devops_infra: "DevOps / hạ tầng"
};

export const ASSESSMENT_LABELS: Record<string, string> = {
  advantages: "Ưu điểm",
  disadvantages: "Nhược điểm",
  improvement_areas: "Cải thiện",
  security: "Bảo mật",
  completeness: "Độ hoàn thiện",
  latency: "Độ trễ (NFR)",
  observability: "Khả năng quan sát (NFR)",
  error_handling: "Xử lý lỗi (NFR)"
};

type ChipGroups = Partial<Record<string, string[]>>;

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-xs flex flex-wrap gap-xs">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-outline-variant bg-surface-container-low px-sm py-0.5 font-body-sm text-on-surface-variant"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function GroupedChips({
  title,
  groups,
  labels
}: {
  title: string;
  groups: ChipGroups | null | undefined;
  labels: Record<string, string>;
}) {
  if (!groups) return null;
  const entries = Object.entries(labels)
    .map(([key, label]) => ({ key, label, items: groups[key] ?? [] }))
    .filter((entry) => entry.items.length > 0);
  if (entries.length === 0) return null;

  return (
    <section>
      <h3 className="font-label-md text-on-surface">{title}</h3>
      <ul className="mt-sm space-y-sm">
        {entries.map((entry) => (
          <li key={entry.key}>
            <p className="font-label-sm text-on-surface">{entry.label}</p>
            <ChipList items={entry.items} />
          </li>
        ))}
      </ul>
    </section>
  );
}

interface AiReviewTechInventoryViewProps {
  techStack?: TechStackGroup | null;
  inventoryExhaustive?: InventoryExhaustive | null;
  ragFeatures?: string[];
}

export function AiReviewTechInventoryView({
  techStack,
  inventoryExhaustive,
  ragFeatures
}: AiReviewTechInventoryViewProps) {
  const hasRag = ragFeatures && ragFeatures.length > 0;
  const hasTech = techStack && Object.values(techStack).some((v) => (v?.length ?? 0) > 0);
  const hasInventory =
    inventoryExhaustive && Object.values(inventoryExhaustive).some((v) => (v?.length ?? 0) > 0);
  if (!hasTech && !hasInventory && !hasRag) return null;

  return (
    <div className="space-y-md">
      <GroupedChips
        title="Ngăn xếp công nghệ (tổng hợp)"
        groups={techStack as ChipGroups | null | undefined}
        labels={TECH_STACK_LABELS}
      />
      <GroupedChips
        title="Kiểm kê công nghệ (đầy đủ)"
        groups={inventoryExhaustive as ChipGroups | null | undefined}
        labels={INVENTORY_LABELS}
      />
      {hasRag ? (
        <section>
          <h3 className="font-label-md text-on-surface">Tính năng RAG</h3>
          <ChipList items={ragFeatures} />
        </section>
      ) : null}
    </div>
  );
}

export function AssessmentSections({ assessment }: { assessment?: Record<string, string> | null }) {
  const entries = assessment
    ? Object.entries(assessment).filter(([, value]) => value.trim())
    : [];
  if (entries.length === 0) return null;

  return (
    <section>
      <h3 className="font-label-md text-on-surface">Đánh giá</h3>
      <ul className="mt-sm space-y-sm">
        {entries.map(([key, value]) => (
          <li key={key} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-sm">
            <p className="font-label-sm text-on-surface">{ASSESSMENT_LABELS[key] ?? key}</p>
            <p className="mt-xs whitespace-pre-wrap font-body-sm text-on-surface-variant">{value}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
