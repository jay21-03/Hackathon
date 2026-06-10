import type { ApiResponse } from "../types/api";
import type {
  RepositoryAccessStatus,
  RepositoryProvisionStatus,
  SubmissionStatus
} from "./repositoryProvisioningService";
import { apiClient } from "./apiClient";

export interface JudgeRepositoryResponse {
  id: number;
  teamId: number;
  teamName?: string | null;
  roundId?: number | null;
  boardId?: number | null;
  boardName?: string | null;
  problemId?: number | null;
  problemTitle?: string | null;
  repositoryUrl?: string | null;
  cloneUrl?: string | null;
  repositoryName?: string | null;
  githubOwner?: string | null;
  githubRepoName?: string | null;
  accessStatus: RepositoryAccessStatus;
  provisionStatus: RepositoryProvisionStatus;
  submissionStatus?: SubmissionStatus | null;
  submittedAt?: string | null;
  openedAt?: string | null;
  closedAt?: string | null;
  provisionedAt?: string | null;
  lastPushAt?: string | null;
  judgeGithubUsername?: string | null;
  judgeHasGithubUsername: boolean;
  judgeGithubAccessGranted?: boolean | null;
}

export interface JudgeAccessGrantItem {
  repositoryId: number;
  teamId: number;
  teamName?: string | null;
  judgeId: number;
  judgeUsername?: string | null;
  access: string;
  status: string;
  error?: string | null;
}

export interface GrantJudgeAccessResponse {
  roundId: number;
  totalRepositories: number;
  totalJudges: number;
  grantedCount: number;
  failedCount: number;
  skippedCount: number;
  grants: JudgeAccessGrantItem[];
}

export async function fetchJudgeRepositories() {
  const { data } = await apiClient.get<ApiResponse<JudgeRepositoryResponse[]>>("/v1/me/judge/repositories");
  return data.data ?? [];
}

export async function fetchJudgeRepositoriesForRound(roundId: number) {
  const { data } = await apiClient.get<ApiResponse<JudgeRepositoryResponse[]>>(
    `/v1/me/judge/rounds/${roundId}/repositories`
  );
  return data.data ?? [];
}

export async function grantRoundJudgeAccess(roundId: number) {
  const { data } = await apiClient.post<ApiResponse<GrantJudgeAccessResponse>>(
    `/v1/admin/rounds/${roundId}/repositories/grant-judge-access`
  );
  if (!data.data) {
    throw new Error(data.message || "Không cấp quyền giám khảo được.");
  }
  return data.data;
}
