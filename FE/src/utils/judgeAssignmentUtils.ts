import type { BadgeTone } from "../components/ui/Badge";
import type { AssignmentResponse } from "../services/assignmentService";
import { pickActiveRound, type RoundScheduleLike } from "./pickActiveRound";

export type JudgeBoardReadiness =
  | "NO_PROBLEM"
  | "WAITING_PROBLEM_RELEASE"
  | "WAITING_RUBRIC"
  | "WAITING_TEAMS"
  | "WAITING_REPOSITORIES"
  | "READY_TO_SCORE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PROBLEM_CLOSED";

const READINESS_LABELS: Record<JudgeBoardReadiness, string> = {
  NO_PROBLEM: "Chưa có đề",
  WAITING_PROBLEM_RELEASE: "Chờ công bố đề",
  WAITING_RUBRIC: "Chờ tiêu chí chấm",
  WAITING_TEAMS: "Chờ gán đội",
  WAITING_REPOSITORIES: "Chờ repo GitHub",
  READY_TO_SCORE: "Sẵn sàng chấm",
  IN_PROGRESS: "Đang chấm",
  COMPLETED: "Đã hoàn tất",
  PROBLEM_CLOSED: "Đã khóa đề"
};

const READINESS_TONES: Record<JudgeBoardReadiness, BadgeTone> = {
  NO_PROBLEM: "neutral",
  WAITING_PROBLEM_RELEASE: "warning",
  WAITING_RUBRIC: "warning",
  WAITING_TEAMS: "warning",
  WAITING_REPOSITORIES: "warning",
  READY_TO_SCORE: "success",
  IN_PROGRESS: "active",
  COMPLETED: "success",
  PROBLEM_CLOSED: "neutral"
};

const SCORING_ALLOWED: JudgeBoardReadiness[] = [
  "READY_TO_SCORE",
  "IN_PROGRESS",
  "COMPLETED",
  "PROBLEM_CLOSED"
];

export function formatBoardAssignmentLabel(assignment: AssignmentResponse): string {
  const event = assignment.eventName ?? "Cuộc thi";
  const round = assignment.roundName ?? "Vòng";
  const board = assignment.boardName ?? `Bảng #${assignment.boardId}`;
  return `${event} · ${round} · ${board}`;
}

export function formatBoardAssignmentShortLabel(assignment: AssignmentResponse): string {
  const round = assignment.roundName ?? "Vòng";
  const board = assignment.boardName ?? `Bảng #${assignment.boardId}`;
  return `${round} · ${board}`;
}

export function readinessLabel(readiness?: JudgeBoardReadiness | null): string {
  if (!readiness) return "Chưa xác định";
  return READINESS_LABELS[readiness] ?? readiness;
}

export function readinessTone(readiness?: JudgeBoardReadiness | null): BadgeTone {
  if (!readiness) return "neutral";
  return READINESS_TONES[readiness] ?? "neutral";
}

export function formatScoringProgress(assignment: AssignmentResponse): string {
  const total = assignment.teamsCount ?? 0;
  const submitted = assignment.submittedSheetsCount ?? 0;
  if (total === 0) return "—";
  return `${submitted}/${total} phiếu`;
}

export function canOpenScoringMatrix(assignment: AssignmentResponse): boolean {
  const readiness = assignment.readiness as JudgeBoardReadiness | undefined;
  if (!readiness) return false;
  return SCORING_ALLOWED.includes(readiness);
}

/** Hướng dẫn khi bảng chưa sẵn sàng chấm. */
export function readinessGuidance(readiness?: JudgeBoardReadiness | null): string | null {
  switch (readiness) {
    case "NO_PROBLEM":
      return "Ban tổ chức chưa tạo đề cho bảng này — liên hệ BTC hoặc đợi cập nhật.";
    case "WAITING_PROBLEM_RELEASE":
      return "Đề chưa mở — phiếu chấm sẽ khả dụng khi BTC công bố đề theo lịch.";
    case "WAITING_RUBRIC":
      return "Chưa cấu hình tiêu chí chấm — BTC cần thiết lập tiêu chí trước.";
    case "WAITING_TEAMS":
      return "Chưa gán đội vào bảng — đợi BTC hoàn tất phân bổ đội.";
    case "WAITING_REPOSITORIES":
      return "Đang chờ cấp repository GitHub cho đội — thử lại sau vài phút.";
    case undefined:
    case null:
      return "Trạng thái bảng chưa xác định — thử tải lại hoặc liên hệ BTC.";
    default:
      return null;
  }
}

export function scoringCtaLabel(assignment: AssignmentResponse): string {
  const readiness = assignment.readiness as JudgeBoardReadiness | undefined;
  if (readiness === "COMPLETED") return "Xem phiếu chấm";
  if (readiness === "IN_PROGRESS" || readiness === "PROBLEM_CLOSED") return "Tiếp tục chấm";
  if (readiness === "READY_TO_SCORE") return "Mở phiếu chấm";
  return "Xem chi tiết";
}

export function isAssignmentDone(assignment: AssignmentResponse): boolean {
  return assignment.readiness === "COMPLETED";
}

export function isArchivedTermAssignment(assignment: AssignmentResponse): boolean {
  return assignment.academicTermStatus === "ARCHIVED";
}

export function excludeArchivedTermJudgeAssignments(
  assignments: AssignmentResponse[]
): AssignmentResponse[] {
  return assignments.filter((item) => !isArchivedTermAssignment(item));
}

export function partitionJudgeAssignments(assignments: AssignmentResponse[]) {
  const todo = assignments.filter((item) => !isAssignmentDone(item));
  const done = assignments.filter((item) => isAssignmentDone(item));
  return { todo, done };
}

export function listActiveJudgeEvents(
  assignments: AssignmentResponse[]
): Array<{ id: number; name: string }> {
  const map = new Map<number, string>();
  for (const item of assignments) {
    if (item.eventId == null || isAssignmentDone(item)) continue;
    map.set(item.eventId, item.eventName ?? `Cuộc thi #${item.eventId}`);
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }));
}

function readinessSortKey(readiness?: JudgeBoardReadiness | null): number {
  switch (readiness) {
    case "IN_PROGRESS":
      return 0;
    case "READY_TO_SCORE":
      return 1;
    case "PROBLEM_CLOSED":
      return 2;
    case "COMPLETED":
      return 100;
    default:
      return 50;
  }
}

function buildRoundSchedulesFromAssignments(assignments: AssignmentResponse[]): RoundScheduleLike[] {
  const map = new Map<number, RoundScheduleLike & { roundOrder: number }>();
  for (const item of assignments) {
    if (item.roundId == null) continue;
    const start = item.problemReleaseAt ?? "1970-01-01T00:00:00Z";
    const end = item.problemCloseAt ?? "2099-12-31T23:59:59Z";
    const current = map.get(item.roundId);
    if (!current) {
      map.set(item.roundId, {
        id: item.roundId,
        roundOrder: item.roundId,
        startAt: start,
        endAt: end
      });
      continue;
    }
    if (Date.parse(start) < Date.parse(current.startAt)) current.startAt = start;
    if (Date.parse(end) > Date.parse(current.endAt)) current.endAt = end;
  }
  return [...map.values()];
}

function compareAssignmentsByPriority(a: AssignmentResponse, b: AssignmentResponse): number {
  const readinessDelta =
    readinessSortKey(a.readiness as JudgeBoardReadiness) -
    readinessSortKey(b.readiness as JudgeBoardReadiness);
  if (readinessDelta !== 0) return readinessDelta;

  const aMissing = (a.teamsCount ?? 0) - (a.submittedSheetsCount ?? 0);
  const bMissing = (b.teamsCount ?? 0) - (b.submittedSheetsCount ?? 0);
  if (aMissing !== bMissing) return bMissing - aMissing;

  return (a.boardName ?? "").localeCompare(b.boardName ?? "", "vi");
}

export function sortAssignmentsByPriority(assignments: AssignmentResponse[]): AssignmentResponse[] {
  return [...assignments].sort(compareAssignmentsByPriority);
}

/** Ưu tiên bảng cần chấm: vòng hiện tại + trạng thái IN_PROGRESS/READY. */
export function pickPriorityJudgeAssignment(
  assignments: AssignmentResponse[],
  preferredBoardId?: number | null
): AssignmentResponse | null {
  if (assignments.length === 0) return null;

  if (preferredBoardId != null) {
    const preferred = assignments.find((item) => item.boardId === preferredBoardId);
    if (preferred) return preferred;
  }

  const actionable = assignments.filter(
    (item) => canOpenScoringMatrix(item) && !isAssignmentDone(item)
  );
  const pending = assignments.filter((item) => !isAssignmentDone(item));
  const pool = actionable.length > 0 ? actionable : pending.length > 0 ? pending : assignments;

  const activeRound = pickActiveRound(buildRoundSchedulesFromAssignments(pool));
  const inActiveRound = activeRound
    ? pool.filter((item) => item.roundId === activeRound.id)
    : pool;
  const candidates = inActiveRound.length > 0 ? inActiveRound : pool;

  return sortAssignmentsByPriority(candidates)[0] ?? null;
}

export function groupAssignmentsByEvent(
  assignments: AssignmentResponse[]
): Array<{ eventName: string; items: AssignmentResponse[] }> {
  const map = new Map<string, AssignmentResponse[]>();
  for (const item of sortAssignmentsByPriority(assignments)) {
    const key = item.eventName ?? "Cuộc thi";
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return [...map.entries()].map(([eventName, items]) => ({ eventName, items }));
}

