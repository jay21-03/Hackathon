import { apiClient } from "./apiClient";
import type { ApiResponse } from "../types/api";

export interface AssignmentResponse {
  id: number;
  boardId: number;
  assigneeId: number;
  createdAt: string;
  createdBy: number;
}

export async function fetchMentorAssignments() {
  const response = await apiClient.get<ApiResponse<AssignmentResponse[]>>("/v1/mentors/assignments");
  return response.data.data ?? [];
}

export async function fetchJudgeAssignments() {
  const response = await apiClient.get<ApiResponse<AssignmentResponse[]>>("/v1/judges/assignments");
  return response.data.data ?? [];
}

export async function assignMentor(boardId: number, userId: number) {
  const { data } = await apiClient.post<ApiResponse<AssignmentResponse>>(
    `/v1/boards/${boardId}/mentors`,
    { userId }
  );
  if (!data.data) {
    throw new Error(data.message || "Gán mentor that bai");
  }
  return data.data;
}

export async function assignJudge(boardId: number, userId: number) {
  const { data } = await apiClient.post<ApiResponse<AssignmentResponse>>(
    `/v1/boards/${boardId}/judges`,
    { userId }
  );
  if (!data.data) {
    throw new Error(data.message || "Gan giám khảo that bai");
  }
  return data.data;
}

export async function removeMentor(boardId: number, mentorId: number) {
  await apiClient.delete(`/v1/boards/${boardId}/mentors/${mentorId}`);
}

export async function removeJudge(boardId: number, judgeId: number) {
  await apiClient.delete(`/v1/boards/${boardId}/judges/${judgeId}`);
}

export async function fetchBoardMentors(boardId: number) {
  const { data } = await apiClient.get<ApiResponse<AssignmentResponse[]>>(
    `/v1/boards/${boardId}/mentors`
  );
  return data.data ?? [];
}

export async function fetchBoardJudges(boardId: number) {
  const { data } = await apiClient.get<ApiResponse<AssignmentResponse[]>>(
    `/v1/boards/${boardId}/judges`
  );
  return data.data ?? [];
}
