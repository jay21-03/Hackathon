export type StaffManagementStep = "#staff-step-carryover" | "#staff-step-invitations";

const LEGACY_HASH: Record<string, StaffManagementStep> = {
  "#staff-step-carryover": "#staff-step-carryover",
  "#staff-step-invitations": "#staff-step-invitations",
  "#teams-step-invitations-staff": "#staff-step-invitations",
  "#staff-step-templates": "#staff-step-invitations",
  "#teams-step-invitations-templates": "#staff-step-invitations"
};

export function normalizeStaffManagementStep(anchor: string): StaffManagementStep {
  return LEGACY_HASH[anchor] ?? "#staff-step-invitations";
}

export function resolveStaffManagementStep(
  microSteps: Array<{ anchor?: string; state: string }>,
  showCarryover: boolean
): StaffManagementStep {
  const active = microSteps.find((step) => step.state === "active" && step.anchor);
  if (active?.anchor) return normalizeStaffManagementStep(active.anchor);
  const next = microSteps.find((step) => step.state === "next" && step.anchor);
  if (next?.anchor) return normalizeStaffManagementStep(next.anchor);
  return showCarryover ? "#staff-step-carryover" : "#staff-step-invitations";
}
