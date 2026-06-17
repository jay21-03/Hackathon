import { Badge } from "../ui/Badge";
import type { AgentIntelligence } from "../../services/aiReviewApi";

interface AiReviewAgentIntelligenceViewProps {
  agentIntelligence?: AgentIntelligence | null;
}

export function AiReviewAgentIntelligenceView({ agentIntelligence }: AiReviewAgentIntelligenceViewProps) {
  if (!agentIntelligence) return null;

  const hasContent =
    agentIntelligence.reasoning_pattern ||
    (agentIntelligence.detected_skills?.length ?? 0) > 0 ||
    (agentIntelligence.tool_definitions?.length ?? 0) > 0 ||
    agentIntelligence.has_agent_config_files;

  if (!hasContent) return null;

  return (
    <section>
      <h3 className="font-label-md text-on-surface">Agent intelligence</h3>
      <div className="mt-sm space-y-sm rounded-lg border border-outline-variant bg-surface-container-lowest p-sm">
        {agentIntelligence.reasoning_pattern ? (
          <p className="font-body-sm text-on-surface-variant whitespace-pre-wrap">
            <span className="font-label-sm text-on-surface">Reasoning: </span>
            {agentIntelligence.reasoning_pattern}
          </p>
        ) : null}
        {agentIntelligence.detected_skills?.length ? (
          <p className="font-body-sm text-on-surface-variant">
            <span className="font-label-sm text-on-surface">Skills: </span>
            {agentIntelligence.detected_skills.join(", ")}
          </p>
        ) : null}
        {agentIntelligence.tool_definitions?.length ? (
          <p className="font-body-sm text-on-surface-variant">
            <span className="font-label-sm text-on-surface">Tools: </span>
            {agentIntelligence.tool_definitions.join(", ")}
          </p>
        ) : null}
        {agentIntelligence.has_agent_config_files ? (
          <Badge tone="active">Có file cấu hình agent</Badge>
        ) : null}
      </div>
    </section>
  );
}
