export type ResultsHubStep =
  | "#results-step-rubric"
  | "#results-step-scoring"
  | "#results-step-ranking"
  | "#results-step-finals"
  | "#results-step-publish"
  | "#results-step-export";

const LEGACY_HASH: Record<string, ResultsHubStep> = {
  "#results-step-rubric": "#results-step-rubric",
  "#rubric": "#results-step-rubric",
  "#results-step-scoring": "#results-step-scoring",
  "#scoring": "#results-step-scoring",
  "#results-step-ranking": "#results-step-ranking",
  "#ranking": "#results-step-ranking",
  "#results-step-finals": "#results-step-finals",
  "#finals": "#results-step-finals",
  "#results-step-publish": "#results-step-publish",
  "#publish": "#results-step-publish",
  "#results-step-export": "#results-step-export",
  "#export": "#results-step-export"
};

export function normalizeResultsHubStep(anchor: string): ResultsHubStep {
  return LEGACY_HASH[anchor] ?? "#results-step-rubric";
}

export function resolveResultsHubStep(
  microSteps: Array<{ anchor?: string; state: string }>
): ResultsHubStep {
  const active = microSteps.find((step) => step.state === "active" && step.anchor);
  if (active?.anchor) return normalizeResultsHubStep(active.anchor);
  const lastDone = [...microSteps].reverse().find((step) => step.state === "done" && step.anchor);
  if (lastDone?.anchor) return normalizeResultsHubStep(lastDone.anchor);
  return "#results-step-rubric";
}
