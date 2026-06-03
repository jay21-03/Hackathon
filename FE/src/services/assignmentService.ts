import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";
import { demoBoards } from "../mocks/hackathonDemoData";
import type { ApiResponse } from "../types/api";

export interface AssignmentResponse {
  id: number;
  boardId: number;
  assigneeId: number;
  createdAt: string;
  createdBy: number;
}

export async function fetchBoards(eventId: string) {
  return withApiFallback(() => apiClient.get(`/events/${eventId}/boards`).then((r) => r.data), demoBoards);
}

export async function fetchMentorAssignments() {
  const response = await apiClient.get<ApiResponse<AssignmentResponse[]>>("/v1/mentors/assignments");
  return response.data.data ?? [];
}

export async function fetchJudgeAssignments() {
  const response = await apiClient.get<ApiResponse<AssignmentResponse[]>>("/v1/judges/assignments");
  return response.data.data ?? [];
}

export async function assignMentor(boardId: string, mentorId: string) {
  try {
    const res = await apiClient.post(`/v1/boards/${boardId}/mentors`, { userId: Number(mentorId) });
    return { data: res.data, usingFallback: false };
  } catch {
    return { data: { boardId, mentorId }, usingFallback: true };
  }
}

export async function assignJudge(boardId: string, judgeId: string) {
  try {
    const res = await apiClient.post(`/v1/boards/${boardId}/judges`, { userId: Number(judgeId) });
    return { data: res.data, usingFallback: false };
  } catch {
    return { data: { boardId, judgeId }, usingFallback: true };
  }
}
