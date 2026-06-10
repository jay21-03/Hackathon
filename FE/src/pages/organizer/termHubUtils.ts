export type TermHubStep =
  | "#term-step-overview"
  | "#term-step-competition"
  | "#term-step-people"
  | "#term-step-results";

export type TermScopedTab =
  | "events"
  | "teams"
  | "participants"
  | "mentors"
  | "judges"
  | "rankings"
  | "repositories"
  | "score-sheets";

const LEGACY_HASH: Record<string, TermHubStep> = {
  "#term-step-overview": "#term-step-overview",
  "#overview": "#term-step-overview",
  "#term-step-competition": "#term-step-competition",
  "#competition": "#term-step-competition",
  "#term-step-people": "#term-step-people",
  "#people": "#term-step-people",
  "#term-step-results": "#term-step-results",
  "#results": "#term-step-results"
};

export const TERM_HUB_TABS: Record<TermHubStep, TermScopedTab[]> = {
  "#term-step-overview": [],
  "#term-step-competition": ["events", "teams"],
  "#term-step-people": ["participants", "mentors", "judges"],
  "#term-step-results": ["rankings", "score-sheets", "repositories"]
};

export const TERM_TAB_LABELS: Record<TermScopedTab, string> = {
  events: "Cuộc thi",
  teams: "Đội",
  participants: "Thí sinh",
  mentors: "Mentor",
  judges: "Giám khảo",
  rankings: "Xếp hạng",
  repositories: "Repository",
  "score-sheets": "Phiếu chấm"
};

export function normalizeTermHubStep(anchor: string): TermHubStep {
  return LEGACY_HASH[anchor] ?? "#term-step-overview";
}

export function resolveTermHubStep(
  microSteps: Array<{ anchor?: string; state: string }>
): TermHubStep {
  const active = microSteps.find((step) => step.state === "active" && step.anchor);
  if (active?.anchor) return normalizeTermHubStep(active.anchor);
  const next = microSteps.find((step) => step.state === "next" && step.anchor);
  if (next?.anchor) return normalizeTermHubStep(next.anchor);
  return "#term-step-overview";
}

export function defaultTabForStep(step: TermHubStep): TermScopedTab {
  return TERM_HUB_TABS[step][0] ?? "events";
}
