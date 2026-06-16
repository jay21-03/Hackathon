export type TeamsHubStep = "#teams-step-registrations" | "#teams-step-invitations-members";

const LEGACY_HASH: Record<string, TeamsHubStep> = {
  "#teams-step-registrations": "#teams-step-registrations",
  "#registrations": "#teams-step-registrations",
  "#teams-step-invitations": "#teams-step-invitations-members",
  "#teams-step-invitations-members": "#teams-step-invitations-members",
  "#teams-step-invitations-templates": "#teams-step-invitations-members"
};
export function normalizeTeamsHubStep(anchor: string): TeamsHubStep {
  return LEGACY_HASH[anchor] ?? "#teams-step-registrations";
}

export function resolveTeamsHubStep(
  microSteps: Array<{ anchor?: string; state: string }>
): TeamsHubStep {
  const active = microSteps.find((step) => step.state === "active" && step.anchor);
  if (active?.anchor) return normalizeTeamsHubStep(active.anchor);
  const lastDone = [...microSteps].reverse().find((step) => step.state === "done" && step.anchor);
  if (lastDone?.anchor) return normalizeTeamsHubStep(lastDone.anchor);
  return "#teams-step-registrations";
}
