import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export interface LevelDescriptor {
  level: string;
  label: string;
  minScore: number;
  maxScore: number;
  description: string;
}

export interface CriteriaResponse {
  id: number;
  code: string;
  name: string;
  weight: number;
  minScore: number;
  maxScore: number;
  description?: string | null;
  sortOrder?: number | null;
  levelDescriptors: LevelDescriptor[];
}

export interface RubricResponse {
  roundId: number;
  criteria: CriteriaResponse[];
  totalWeight: number;
  locked: boolean;
}

export interface CriteriaRequestItem {
  code: string;
  name: string;
  weight: number;
  minScore: number;
  maxScore: number;
  description?: string;
  levelDescriptors: LevelDescriptor[];
  sortOrder?: number;
}

export interface SaveRubricRequest {
  criteria: CriteriaRequestItem[];
  replaceExisting?: boolean;
}

export interface ComputedScoreDto {
  judgeTeamScore: number;
  formula?: string;
}

export interface ScoreItemResponse {
  criteriaId: number;
  criteriaCode: string;
  scoreValue: number | null;
  comment?: string | null;
}

export interface MatrixTeamRowResponse {
  teamId: number;
  teamName: string;
  repositoryUrl?: string | null;
  slotNumber: number;
  sheetId: number;
  status: "DRAFT" | "SUBMITTED";
  generalFeedback?: string | null;
  editable: boolean;
  scores: ScoreItemResponse[];
  computed?: ComputedScoreDto | null;
}

export interface BoardBriefDto {
  id: number;
  name: string;
  roundId: number;
  roundName?: string;
}

export interface JudgeBriefDto {
  id: number;
  fullName: string;
}

export interface MatrixSummaryDto {
  teamCount: number;
  draftCount: number;
  submittedCount: number;
  criteriaCount: number;
}

export interface ScoreMatrixResponse {
  board: BoardBriefDto;
  judge: JudgeBriefDto;
  criteria: CriteriaResponse[];
  teams: MatrixTeamRowResponse[];
  summary: MatrixSummaryDto;
}

export interface ScoreItemInput {
  criteriaId: number;
  scoreValue?: number | null;
  comment?: string;
}

export interface MatrixRowInput {
  teamId: number;
  generalFeedback?: string;
  scores?: ScoreItemInput[];
}

export interface SaveMatrixRequest {
  rows: MatrixRowInput[];
}

export interface SaveMatrixResponse {
  savedTeamIds: number[];
  skippedSubmittedTeamIds: number[];
  rows: MatrixTeamRowResponse[];
}

export interface SubmitMatrixRequest {
  submitAll?: boolean;
  teamIds?: number[];
}

export interface SubmittedSheetDto {
  sheetId: number;
  teamId: number;
  status: string;
}

export interface SubmitFailureDto {
  teamId: number;
  errorCode: string;
  missingCriteriaIds?: number[];
}

export interface SubmitMatrixResponse {
  submitted: SubmittedSheetDto[];
  failed: SubmitFailureDto[];
}

export interface ProgressSummaryDto {
  teamCount: number;
  judgeCount: number;
  expectedSheets: number;
  submittedSheets: number;
  draftSheets: number;
  missingSheets: number;
  completionPercent: number;
}

export interface JudgeSheetStatusDto {
  judgeId: number;
  status: string;
  sheetId?: number | null;
  judgeTeamScore?: number | null;
}

export interface JudgeProgressDto {
  judgeId: number;
  fullName: string;
  submittedCount: number;
  totalTeams: number;
}

export interface TeamProgressDto {
  teamId: number;
  teamName: string;
  judges: JudgeSheetStatusDto[];
  submittedJudgeCount: number;
  requiredJudgeCount: number;
  scoringStatus?: "SCORABLE" | "REPO_NOT_READY" | string | null;
  ineligibleReason?: string | null;
}

export interface ScoreProgressResponse {
  boardId: number;
  boardName: string;
  roundId: number;
  summary: ProgressSummaryDto;
  judges: JudgeProgressDto[];
  teams: TeamProgressDto[];
}

export interface EventScoreProgressResponse {
  eventId: number;
  eventName: string;
  summary: ProgressSummaryDto;
  boards: ScoreProgressResponse[];
  boardsWithoutJudges: number[];
  boardsIncomplete: number[];
}

export interface DemoScoringCompletionResponse {
  eventId: number;
  boardsProcessed: number;
  scoreSheetsCreated: number;
  scoreSheetsSubmitted: number;
  scoreItemsCopied: number;
  skippedTeamsWithoutSample: number;
}

export const DEFAULT_LEVEL_DESCRIPTORS: LevelDescriptor[] = [
  {
    level: "EXCELLENT",
    label: "Xuất sắc",
    minScore: 9,
    maxScore: 10,
    description: "Vượt mong đợi so với yêu cầu của tiêu chí."
  },
  {
    level: "GOOD",
    label: "Tốt",
    minScore: 7,
    maxScore: 8.9,
    description: "Đáp ứng tốt hầu hết yêu cầu, chỉ còn điểm cần cải thiện nhỏ."
  },
  {
    level: "SATISFACTORY",
    label: "Đạt",
    minScore: 5,
    maxScore: 6.9,
    description: "Đáp ứng một phần yêu cầu, còn thiếu sót rõ ràng."
  },
  {
    level: "UNSATISFACTORY",
    label: "Chưa đạt",
    minScore: 0,
    maxScore: 4.9,
    description: "Chưa đáp ứng yêu cầu tối thiểu của tiêu chí."
  }
];

const VALID_LEVEL_CODES = new Set(["EXCELLENT", "GOOD", "SATISFACTORY", "UNSATISFACTORY"]);

/** Chuẩn hóa mức chấm — BE yêu cầu level = EXCELLENT|GOOD|SATISFACTORY|UNSATISFACTORY. */
export function normalizeLevelDescriptors(input?: Partial<LevelDescriptor>[]): LevelDescriptor[] {
  const defaults = DEFAULT_LEVEL_DESCRIPTORS.map((d) => ({ ...d }));
  if (!input?.length) return defaults;
  return defaults.map((fallback, index) => {
    const source = input[index] ?? {};
    const rawLevel = String(source.level ?? "").trim().toUpperCase();
    let level = fallback.level;
    if (VALID_LEVEL_CODES.has(rawLevel)) {
      level = rawLevel;
    } else if (rawLevel === "1" || rawLevel === "4") {
      level = "EXCELLENT";
    } else if (rawLevel === "2") {
      level = "GOOD";
    } else if (rawLevel === "3") {
      level = "SATISFACTORY";
    }
    return {
      level,
      label: source.label?.trim() || fallback.label,
      minScore: Number(source.minScore ?? fallback.minScore),
      maxScore: Number(source.maxScore ?? fallback.maxScore),
      description: source.description?.trim() || fallback.description || ""
    };
  });
}

export function deriveCriteriaScoreRange(levelDescriptors: LevelDescriptor[]): {
  minScore: number;
  maxScore: number;
} {
  const mins = levelDescriptors.map((l) => Number(l.minScore));
  const maxs = levelDescriptors.map((l) => Number(l.maxScore));
  return {
    minScore: Math.min(...mins),
    maxScore: Math.max(...maxs)
  };
}

const HACKATHON_RUBRIC_DEFAULTS: Record<
  string,
  { description: string; levelDescriptions: Record<string, string> }
> = {
  R1_01: {
    description:
      "Đánh giá mức độ hoàn thiện chức năng, độ ổn định và khả năng xử lý các luồng nghiệp vụ chính của sản phẩm.",
    levelDescriptions: {
      EXCELLENT:
        "Hoàn thiện cao, ít lỗi, xử lý tốt các trường hợp ngoại lệ và luồng phức tạp.",
      GOOD: "Hầu hết chức năng ổn định, đáp ứng đúng yêu cầu đề bài.",
      SATISFACTORY: "Một số chức năng chính hoạt động nhưng còn lỗi hoặc thiếu xử lý edge case.",
      UNSATISFACTORY:
        "Sản phẩm không chạy được hoặc thiếu phần lớn chức năng bắt buộc theo đề bài."
    }
  },
  R1_02: {
    description:
      "Đánh giá cách team tích hợp và khai thác AI/ML trong giải pháp (mục đích, độ phù hợp, hiệu quả thực tế).",
    levelDescriptions: {
      EXCELLENT: "AI được thiết kế tốt, tạo giá trị rõ rệt và được demo thuyết phục.",
      GOOD: "AI được áp dụng hợp lý, hỗ trợ rõ ràng cho chức năng cốt lõi.",
      SATISFACTORY: "Có dùng AI cơ bản nhưng chưa rõ giá trị hoặc chưa ổn định trong demo.",
      UNSATISFACTORY: "Không có tích hợp AI hoặc chỉ mang tính hình thức, không gắn với bài toán."
    }
  },
  R1_03: {
    description:
      "Đánh giá kiến trúc, phân tách module, chất lượng mã nguồn và khả năng bảo trì/mở rộng.",
    levelDescriptions: {
      EXCELLENT: "Thiết kế chuyên nghiệp, dễ mở rộng, tuân thủ best practice tốt.",
      GOOD: "Kiến trúc rõ ràng, mã dễ theo dõi, phù hợp quy mô dự án.",
      SATISFACTORY: "Có cấu trúc cơ bản nhưng còn coupling cao hoặc thiếu nhất quán.",
      UNSATISFACTORY: "Cấu trúc lộn xộn, khó đọc hoặc không có ranh giới module rõ ràng."
    }
  },
  R1_04: {
    description:
      "Đánh giá khả năng trình bày, demo trực tiếp và trả lời câu hỏi của ban giám khảo.",
    levelDescriptions: {
      EXCELLENT:
        "Thuyết trình thuyết phục, demo ấn tượng, phản hồi câu hỏi sâu và chính xác.",
      GOOD: "Demo ổn định, trình bày mạch lạc, trả lời được phần lớn câu hỏi.",
      SATISFACTORY: "Trình bày được ý chính nhưng demo chưa mượt hoặc thiếu rõ ràng.",
      UNSATISFACTORY: "Không trình bày được luồng chính hoặc demo thất bại."
    }
  },
  R1_05: {
    description:
      "Đánh giá phối hợp nhóm, phân công công việc và tinh thần hợp tác trong quá trình làm bài.",
    levelDescriptions: {
      EXCELLENT:
        "Teamwork xuất sắc, phối hợp nhịp nhàng và thể hiện tinh thần hợp tác chuyên nghiệp.",
      GOOD: "Phối hợp tốt, mỗi thành viên đóng góp rõ vai trò trong demo.",
      SATISFACTORY: "Có phân công cơ bản nhưng chưa thể hiện teamwork nhất quán.",
      UNSATISFACTORY:
        "Thiếu phối hợp rõ rệt; thành viên không đóng góp hoặc mâu thuẫn trong trình bày."
    }
  }
};

const HACKATHON_CRITERIA_TEMPLATE: Array<{ code: string; name: string; weight: number }> = [
  { code: "R1_01", name: "Tính đúng đắn & Hoàn thiện chức năng", weight: 30 },
  { code: "R1_02", name: "Ứng dụng AI trong giải pháp", weight: 25 },
  { code: "R1_03", name: "Thiết kế & Kiến trúc phần mềm", weight: 15 },
  { code: "R1_04", name: "Thuyết trình & Demo", weight: 20 },
  { code: "R1_05", name: "Teamwork & Tinh thần làm việc", weight: 10 }
];

/** Bổ sung mô tả mặc định cho mã tiêu chí R1_xx khi đang trống. */
export function enrichHackathonRubricCriteria(item: CriteriaRequestItem): CriteriaRequestItem {
  const defaults = HACKATHON_RUBRIC_DEFAULTS[item.code];
  if (!defaults) return item;
  const levelDescriptors = item.levelDescriptors.map((level) => ({
    ...level,
    description:
      level.description?.trim() ||
      defaults.levelDescriptions[level.level] ||
      level.description ||
      ""
  }));
  return {
    ...item,
    description: item.description?.trim() || defaults.description,
    levelDescriptors
  };
}

export function createEmptyCriteria(index: number): CriteriaRequestItem {
  const n = String(index + 1).padStart(2, "0");
  const levels = DEFAULT_LEVEL_DESCRIPTORS.map((d) => ({ ...d }));
  const { minScore, maxScore } = deriveCriteriaScoreRange(levels);
  return {
    code: `R1_${n}`,
    name: "",
    weight: 0,
    minScore,
    maxScore,
    description: "",
    sortOrder: index + 1,
    levelDescriptors: levels
  };
}

export function createDefaultHackathonRubric(): CriteriaRequestItem[] {
  return HACKATHON_CRITERIA_TEMPLATE.map((item, index) => {
    const levels = DEFAULT_LEVEL_DESCRIPTORS.map((d) => ({ ...d }));
    const { minScore, maxScore } = deriveCriteriaScoreRange(levels);
    return enrichHackathonRubricCriteria({
      code: item.code,
      name: item.name,
      weight: item.weight,
      minScore,
      maxScore,
      description: "",
      sortOrder: index + 1,
      levelDescriptors: levels
    });
  });
}

/** BTC — rubric theo round */
export async function fetchRubric(roundId: number) {
  const { data } = await apiClient.get<ApiResponse<RubricResponse>>(
    `/v1/admin/rounds/${roundId}/criteria`
  );
  if (!data.data) {
    throw new Error(data.message || "Không tải được tiêu chí chấm.");
  }
  return data.data;
}

export async function fetchPublicRubric(roundId: number) {
  const { data } = await apiClient.get<ApiResponse<RubricResponse>>(
    `/v1/rounds/${roundId}/criteria`
  );
  if (!data.data) {
    throw new Error(data.message || "Không tải được tiêu chí chấm.");
  }
  return data.data;
}

export async function fetchMyProblemRubric(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<RubricResponse>>(
    "/v1/my/problem-rubric",
    { params: { eventId } }
  );
  if (!data.data) {
    throw new Error(data.message || "Không tải được tiêu chí chấm.");
  }
  return data.data;
}

export async function saveRubric(roundId: number, body: SaveRubricRequest) {
  const { data } = await apiClient.post<ApiResponse<RubricResponse>>(
    `/v1/admin/rounds/${roundId}/criteria`,
    body
  );
  if (!data.data) {
    throw new Error(data.message || "Không lưu được tiêu chí chấm.");
  }
  return data.data;
}

/** BTC — tiến độ chấm theo bảng */
export async function fetchScoreProgress(boardId: number) {
  const { data } = await apiClient.get<ApiResponse<ScoreProgressResponse>>(
    `/v1/admin/boards/${boardId}/score-progress`
  );
  if (!data.data) {
    throw new Error(data.message || "Không tải được tiến độ chấm.");
  }
  return data.data;
}

export async function fetchEventScoreProgress(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<EventScoreProgressResponse>>(
    `/v1/admin/events/${eventId}/score-progress`
  );
  if (!data.data) {
    throw new Error(data.message || "Không tải được tiến độ chấm.");
  }
  return data.data;
}

export async function completeDemoScoring(eventId: number) {
  const { data } = await apiClient.post<ApiResponse<DemoScoringCompletionResponse>>(
    `/v1/admin/events/${eventId}/demo-scoring-complete`
  );
  if (!data.data) {
    throw new Error(data.message || "Không hoàn tất được chấm điểm demo.");
  }
  return data.data;
}

/** BTC — gửi thông báo nhắc giám khảo nộp phiếu chấm */
export interface ScoringReminderResponse {
  notifiedJudgeCount: number;
  notifiedJudgeNames: string[];
  organizerNotified: boolean;
}

export async function sendScoringReminder(boardId: number) {
  const { data } = await apiClient.post<ApiResponse<ScoringReminderResponse>>(
    `/v1/admin/boards/${boardId}/scoring-reminders`
  );
  if (!data.data) {
    throw new Error(data.message || "Gửi nhắc chấm thất bại.");
  }
  return data.data;
}

/** Judge — ma trận chấm điểm */
export async function fetchScoreMatrix(boardId: number) {
  const { data } = await apiClient.get<ApiResponse<ScoreMatrixResponse>>(
    `/v1/judge/boards/${boardId}/score-matrix`
  );
  if (!data.data) {
    throw new Error(data.message || "Không tải được ma trận chấm điểm.");
  }
  return data.data;
}

export async function saveScoreMatrix(boardId: number, body: SaveMatrixRequest) {
  const { data } = await apiClient.put<ApiResponse<SaveMatrixResponse>>(
    `/v1/judge/boards/${boardId}/score-matrix`,
    body
  );
  if (!data.data) {
    throw new Error(data.message || "Lưu nháp thất bại.");
  }
  return data.data;
}

export async function submitScoreMatrix(boardId: number, body: SubmitMatrixRequest = {}) {
  const { data } = await apiClient.post<ApiResponse<SubmitMatrixResponse>>(
    `/v1/judge/boards/${boardId}/score-matrix/submit`,
    body
  );
  if (!data.data) {
    throw new Error(data.message || "Nộp phiếu chấm thất bại.");
  }
  return data.data;
}
