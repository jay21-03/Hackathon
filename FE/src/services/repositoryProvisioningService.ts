import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export type RepositoryAccessStatus = "PENDING" | "OPEN" | "CLOSED" | "FAILED";
export type RepositoryProvisionStatus = "PENDING" | "CREATED" | "FAILED";

export interface RepoTemplateResponse {
  id: number;
  problemId: number;
  templateOwner: string;
  templateRepo: string;
  defaultBranch?: string | null;
  enabled: boolean;
  createdBy?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export type SubmissionStatus = "DRAFT" | "SUBMITTED";

export interface TeamRepositoryResponse {
  id: number;
  teamId: number;
  teamName?: string | null;
  roundId?: number | null;
  roundName?: string | null;
  currentRound?: boolean | null;
  boardId?: number | null;
  problemId?: number | null;
  repositoryUrl?: string | null;
  repositoryName?: string | null;
  githubOwner?: string | null;
  githubRepoName?: string | null;
  githubRepoId?: number | null;
  accessStatus: RepositoryAccessStatus;
  provisionStatus: RepositoryProvisionStatus;
  submissionStatus?: SubmissionStatus | null;
  submittedAt?: string | null;
  openedAt?: string | null;
  closedAt?: string | null;
  provisionedAt?: string | null;
  lastPushAt?: string | null;
  lastError?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveRepoTemplateRequest {
  templateOwner: string;
  templateRepo: string;
  defaultBranch?: string;
  enabled?: boolean;
}

export interface ProvisionProblemRepositoriesResponse {
  problemId: number;
  boardId: number;
  roundId: number;
  totalTeams: number;
  createdCount: number;
  failedCount: number;
  skippedCount: number;
  repositories: TeamRepositoryResponse[];
}

export interface RepositoryLockResponse {
  problemId?: number;
  roundId?: number;
  totalRepositories: number;
  lockedCount: number;
  failedCount: number;
  repositories: TeamRepositoryResponse[];
}

export interface RepositoryRetryResponse {
  repository: TeamRepositoryResponse;
}

export async function fetchProblemRepoTemplate(problemId: number) {
  const { data } = await apiClient.get<ApiResponse<RepoTemplateResponse>>(
    `/v1/admin/problems/${problemId}/repo-template`
  );
  if (!data.data) {
    throw new Error(data.message || "Chưa có mẫu repository cho đề này.");
  }
  return data.data;
}

export async function saveProblemRepoTemplate(problemId: number, body: SaveRepoTemplateRequest) {
  const { data } = await apiClient.put<ApiResponse<RepoTemplateResponse>>(
    `/v1/admin/problems/${problemId}/repo-template`,
    body
  );
  if (!data.data) {
    throw new Error(data.message || "Không lưu được mẫu repository.");
  }
  return data.data;
}

export async function createProblemRepoTemplate(problemId: number, body: SaveRepoTemplateRequest) {
  const { data } = await apiClient.post<ApiResponse<RepoTemplateResponse>>(
    `/v1/admin/problems/${problemId}/repo-template`,
    body
  );
  if (!data.data) {
    throw new Error(data.message || "Không tạo được mẫu repository.");
  }
  return data.data;
}

export async function provisionProblemRepositories(problemId: number, force = false) {
  const { data } = await apiClient.post<ApiResponse<ProvisionProblemRepositoriesResponse>>(
    `/v1/admin/problems/${problemId}/repositories/provision`,
    null,
    { params: { force } }
  );
  if (!data.data) {
    throw new Error(data.message || "Không provision được repository.");
  }
  return data.data;
}

export async function lockProblemRepositories(problemId: number) {
  const { data } = await apiClient.post<ApiResponse<RepositoryLockResponse>>(
    `/v1/admin/problems/${problemId}/repositories/lock`
  );
  if (!data.data) {
    throw new Error(data.message || "Không khóa được repository.");
  }
  return data.data;
}

/** Khóa repo của mọi đề trong vòng đã qua closeAt (không theo endAt vòng). */
export async function lockRoundRepositories(roundId: number) {
  const { data } = await apiClient.post<ApiResponse<RepositoryLockResponse>>(
    `/v1/admin/rounds/${roundId}/repositories/lock`
  );
  if (!data.data) {
    throw new Error(data.message || "Không khóa được repository.");
  }
  return data.data;
}

export async function retryTeamRepository(repositoryId: number) {
  const { data } = await apiClient.post<ApiResponse<RepositoryRetryResponse>>(
    `/v1/admin/team-repositories/${repositoryId}/retry`
  );
  if (!data.data) {
    throw new Error(data.message || "Thử lại provision thất bại.");
  }
  return data.data;
}

export async function fetchEventRepositories(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<TeamRepositoryResponse[]>>(
    `/v1/admin/events/${eventId}/repositories`
  );
  return data.data ?? [];
}

export async function fetchTeamRepositories(teamId: number) {
  const { data } = await apiClient.get<ApiResponse<TeamRepositoryResponse[]>>(
    `/v1/admin/teams/${teamId}/repository`
  );
  return data.data ?? [];
}

export async function fetchMyRepositories() {
  const { data } = await apiClient.get<ApiResponse<TeamRepositoryResponse[]>>("/v1/me/repositories");
  return data.data ?? [];
}

export async function fetchMyTeamRepositories(teamId: number, eventId?: number | null) {
  const { data } = await apiClient.get<ApiResponse<TeamRepositoryResponse[]>>(
    `/v1/me/teams/${teamId}/repository`,
    { params: eventId != null ? { eventId } : undefined }
  );
  return data.data ?? [];
}

export const ACCESS_STATUS_LABELS: Record<RepositoryAccessStatus, string> = {
  PENDING: "Chờ mở",
  OPEN: "Đang mở",
  CLOSED: "Đã khóa",
  FAILED: "Lỗi"
};

export const PROVISION_STATUS_LABELS: Record<RepositoryProvisionStatus, string> = {
  PENDING: "Chờ tạo",
  CREATED: "Đã tạo",
  FAILED: "Thất bại"
};

export function accessStatusTone(status: RepositoryAccessStatus): "success" | "warning" | "neutral" | "danger" {
  if (status === "OPEN") return "success";
  if (status === "CLOSED") return "neutral";
  if (status === "FAILED") return "danger";
  return "warning";
}

export function provisionStatusTone(
  status: RepositoryProvisionStatus
): "success" | "warning" | "neutral" | "danger" {
  if (status === "CREATED") return "success";
  if (status === "FAILED") return "danger";
  return "warning";
}

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  DRAFT: "Chưa nộp",
  SUBMITTED: "Đã nộp (tự động)"
};

export function submissionStatusTone(
  status: SubmissionStatus | null | undefined
): "success" | "warning" | "neutral" {
  if (status === "SUBMITTED") return "success";
  if (status === "DRAFT") return "warning";
  return "neutral";
}

export function formatRepositoryTimestamp(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}
