import { Badge } from "../ui/Badge";
import { AssessmentSections } from "./AiReviewTechInventoryView";
import { parsePerPushStructured } from "../../services/aiReviewApi";
import type { ParsedPerPushReview } from "../../services/aiReviewApi";
import { AiReviewTechInventoryView } from "./AiReviewTechInventoryView";
import { AiReviewAgentIntelligenceView } from "./AiReviewAgentIntelligenceView";
function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="font-label-md text-on-surface">{title}</h3>
      <ul className="mt-xs list-disc space-y-xs pl-5 font-body-sm text-on-surface-variant">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function PerPushContent({ data }: { data: ParsedPerPushReview }) {
  return (
    <div className="space-y-md">
      {data.significantChange ? (
        <Badge tone="warning">Thay đổi quan trọng (significant_change)</Badge>
      ) : null}

      {data.projectAbout ? (
        <section>
          <h3 className="font-label-md text-on-surface">Dự án</h3>
          <p className="mt-xs font-body-sm text-on-surface-variant whitespace-pre-wrap">{data.projectAbout}</p>
        </section>
      ) : null}

      <AiReviewTechInventoryView
        techStack={data.techStack}
        inventoryExhaustive={data.inventoryExhaustive}
        ragFeatures={data.ragFeatures}
      />

      <AiReviewAgentIntelligenceView agentIntelligence={data.agentIntelligence} />

      <AssessmentSections assessment={data.assessment} />

      <BulletList title="Gợi ý test case" items={data.suggestedTestCases ?? []} />
      <BulletList title="Câu hỏi phản biện cho BGK" items={data.suggestedQuestions ?? []} />
      <BulletList title="Gợi ý tinh chỉnh prompt" items={data.suggestedPromptRefinement ?? []} />
    </div>
  );
}

interface AiReviewPerPushDetailViewProps {
  structuredOutput?: string | null;
}

export function AiReviewPerPushDetailView({ structuredOutput }: AiReviewPerPushDetailViewProps) {
  const data = parsePerPushStructured(structuredOutput);
  if (!data) return null;
  return <PerPushContent data={data} />;
}
