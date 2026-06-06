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
}

export interface ScoreProgressResponse {
  boardId: number;
  boardName: string;
  roundId: number;
  summary: ProgressSummaryDto;
  judges: JudgeProgressDto[];
  teams: TeamProgressDto[];
}

export const DEFAULT_LEVEL_DESCRIPTORS: LevelDescriptor[] = [
  { level: "EXCELLENT", label: "Xuất sắc", minScore: 9, maxScore: 10, description: "" },
  { level: "GOOD", label: "Tốt", minScore: 7, maxScore: 8.9, description: "" },
  { level: "SATISFACTORY", label: "Đạt", minScore: 5, maxScore: 6.9, description: "" },
  { level: "UNSATISFACTORY", label: "Chưa đạt", minScore: 0, maxScore: 4.9, description: "" }
];

export function createEmptyCriteria(index: number): CriteriaRequestItem {
  const n = String(index + 1).padStart(2, "0");
  return {
    code: `R1_${n}`,
    name: "",
    weight: 0,
    minScore: 0,
    maxScore: 10,
    description: "",
    sortOrder: index + 1,
    levelDescriptors: DEFAULT_LEVEL_DESCRIPTORS.map((d) => ({ ...d }))
  };
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
