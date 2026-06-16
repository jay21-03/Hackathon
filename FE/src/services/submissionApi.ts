import type { ApiResponse, PagedResult } from "../types/api";
import { apiClient } from "./apiClient";

export type SubmissionStatus = "DRAFT" | "SUBMITTED" | null;

export interface SubmissionResponse {
  teamId: number | null;
  teamName: string | null;
  status: SubmissionStatus;
  repositoryUrl: string | null;
  repositoryName: string | null;
  submittedAt: string | null;
  deadlineAt: string | null;
  canSubmit: boolean;
  editable: boolean;
  blockReason: string | null;
}

export async function fetchMySubmission(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<SubmissionResponse>>("/v1/my/submission", {
    params: { eventId }
  });
  if (!data.data) {
    throw new Error(data.message || "Không tải được bài nộp.");
  }
  return data.data;
}

export async function saveSubmissionDraft(body: {
  eventId: number;
  repositoryUrl: string;
  repositoryName?: string;
}) {
  const { data } = await apiClient.put<ApiResponse<SubmissionResponse>>(
    "/v1/my/submission/draft",
    body
  );
  if (!data.data) {
    throw new Error(data.message || "Lưu nháp thất bại.");
  }
  return data.data;
}

export interface AdminTeamSubmissionResponse {
  teamId: number;
  teamName: string;
  boardId: number | null;
  boardName: string | null;
  slotNumber: number | null;
  status: SubmissionStatus;
  repositoryUrl: string | null;
  repositoryName: string | null;
  submittedAt: string | null;
  lastPushAt?: string | null;
}

export async function fetchEventSubmissions(
  eventId: number,
  options?: {
    boardId?: number | null;
    roundId?: number | null;
    status?: string;
    q?: string;
    page?: number;
    size?: number;
  }
) {
  const { data } = await apiClient.get<ApiResponse<PagedResult<AdminTeamSubmissionResponse>>>(
    `/v1/admin/events/${eventId}/submissions`,
    {
      params: {
        page: options?.page ?? 0,
        size: options?.size ?? 50,
        ...(options?.boardId ? { boardId: options.boardId } : {}),
        ...(options?.roundId ? { roundId: options.roundId } : {}),
        ...(options?.status && options.status !== "ALL" ? { status: options.status } : {}),
        ...(options?.q?.trim() ? { q: options.q.trim() } : {})
      }
    }
  );
  return (
    data.data ?? {
      items: [],
      page: 0,
      size: options?.size ?? 50,
      total: 0,
      totalPages: 0
    }
  );
}

export async function fetchTeamSubmission(
  teamId: number,
  options?: { boardId?: number | null; roundId?: number | null }
) {
  const { data } = await apiClient.get<ApiResponse<AdminTeamSubmissionResponse>>(
    `/v1/admin/teams/${teamId}/submission`,
    {
      params: {
        ...(options?.boardId ? { boardId: options.boardId } : {}),
        ...(options?.roundId ? { roundId: options.roundId } : {})
      }
    }
  );
  if (!data.data) {
    throw new Error(data.message || "Không tải được bài nộp của đội.");
  }
  return data.data;
}

export async function submitSubmission(body: {
  eventId: number;
  repositoryUrl?: string;
  repositoryName?: string;
}) {
  const { data } = await apiClient.post<ApiResponse<SubmissionResponse>>(
    "/v1/my/submission/submit",
    body
  );
  if (!data.data) {
    throw new Error(data.message || "Nộp bài thất bại.");
  }
  return data.data;
}
