export type ArtifactsHubStep =
  | "#artifacts-step-rubric"
  | "#artifacts-step-submissions"
  | "#artifacts-step-repositories";

const LEGACY_HASH: Record<string, ArtifactsHubStep> = {
  "#artifacts-step-rubric": "#artifacts-step-rubric",
  "#rubric": "#artifacts-step-rubric",
  "#results-step-rubric": "#artifacts-step-rubric",
  "#artifacts-step-submissions": "#artifacts-step-submissions",
  "#submissions": "#artifacts-step-submissions",
  "#artifacts-step-repositories": "#artifacts-step-repositories",
  "#repositories": "#artifacts-step-repositories"
};

export function normalizeArtifactsHubStep(anchor: string): ArtifactsHubStep {
  return LEGACY_HASH[anchor] ?? "#artifacts-step-rubric";
}

export function resolveArtifactsHubStep(
  microSteps: Array<{ anchor?: string; state: string }>
): ArtifactsHubStep {
  const active = microSteps.find((step) => step.state === "active" && step.anchor);
  if (active?.anchor) return normalizeArtifactsHubStep(active.anchor);
  const next = microSteps.find((step) => step.state === "next" && step.anchor);
  if (next?.anchor) return normalizeArtifactsHubStep(next.anchor);
  const lastDone = [...microSteps].reverse().find((step) => step.state === "done" && step.anchor);
  return lastDone?.anchor
    ? normalizeArtifactsHubStep(lastDone.anchor)
    : "#artifacts-step-rubric";
}
