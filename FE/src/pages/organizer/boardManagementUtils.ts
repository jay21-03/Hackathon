import type { BoardResponse, BoardSlotResponse, RoundResponse } from "../../services/contestApi";

export interface BoardWithSlots {
  board: BoardResponse;
  slots: BoardSlotResponse[];
}
import type { TeamDetailResponse } from "../../services/registrationService";

export type BoardSetupStep = "#board-step-round" | "#board-step-layout";

import { toIsoFromLocal, toLocalDateTimeInput } from "../../utils/dateTimeInput";

export { toIsoFromLocal, toLocalDateTimeInput as toLocalInput } from "../../utils/dateTimeInput";

const toLocalInput = toLocalDateTimeInput;

export function normalizeBoardStep(anchor: string): BoardSetupStep {
  if (
    anchor === "#board-step-board" ||
    anchor === "#board-step-slots" ||
    anchor === "#board-step-slot" ||
    anchor === "#board-step-assign"
  ) {
    return "#board-step-layout";
  }
  return anchor as BoardSetupStep;
}

export function resolveBoardSetupStep(
  microSteps: Array<{ anchor?: string; state: string }>
): BoardSetupStep {
  const active = microSteps.find((step) => step.state === "active" && step.anchor);
  if (active?.anchor) return normalizeBoardStep(active.anchor);
  const lastDone = [...microSteps].reverse().find((step) => step.state === "done" && step.anchor);
  if (lastDone?.anchor) return normalizeBoardStep(lastDone.anchor);
  return "#board-step-round";
}

export function countTeamMembers(team: TeamDetailResponse) {
  const members = team.members ?? [];
  const confirmed = members.filter((m) => m.status === "CONFIRMED").length;
  return { total: members.length, confirmed };
}

export function boardAssignmentStats(slots: BoardSlotResponse[], teams: TeamDetailResponse[]) {
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  let memberCount = 0;
  let teamCount = 0;
  for (const slot of slots) {
    if (!slot.teamId) continue;
    teamCount += 1;
    const team = teamById[slot.teamId];
    if (team) memberCount += countTeamMembers(team).confirmed;
  }
  return { teamCount, memberCount, slotCount: slots.length };
}

export function defaultRoundTimes(startDate: string, endDate: string) {
  const start = startDate ? `${startDate}T08:00` : "";
  const end = endDate ? `${endDate}T17:00` : "";
  return { start, end };
}

export function roundNameForKind(kind: "GROUP_STAGE" | "FINAL", order: number) {
  return kind === "FINAL" ? "Chung kết" : `Vòng ${order}`;
}

export function suggestNextRound(rounds: RoundResponse[]) {
  const maxOrder = rounds.reduce((max, round) => Math.max(max, round.roundOrder), 0);
  const nextOrder = maxOrder + 1;
  const lastRound = [...rounds].sort((a, b) => b.roundOrder - a.roundOrder)[0];
  const hasFinal = rounds.some((round) => round.roundType === "FINAL");

  let startAt = "";
  let endAt = "";
  if (lastRound?.endAt) {
    const lastEnd = new Date(lastRound.endAt);
    const nextStart = new Date(lastEnd.getTime() + 60 * 60 * 1000);
    const nextEnd = new Date(lastEnd.getTime() + 24 * 60 * 60 * 1000);
    startAt = toLocalInput(nextStart.toISOString());
    endAt = toLocalInput(nextEnd.toISOString());
  }

  const roundType = (!hasFinal && nextOrder >= 2 ? "FINAL" : "GROUP_STAGE") as "GROUP_STAGE" | "FINAL";
  return {
    name: roundNameForKind(roundType, nextOrder),
    roundType,
    roundOrder: nextOrder,
    startAt,
    endAt
  };
}
