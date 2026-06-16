import { apiClient } from "./apiClient";
import type { ApiResponse } from "../types/api";

export type AcademicTermStatus = "ACTIVE" | "ARCHIVED";

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

export interface AssignmentResponse {
  id: number;
  boardId: number;
  boardName?: string | null;
  roundId?: number | null;
  roundName?: string | null;
  eventId?: number | null;
  eventName?: string | null;
  academicTermId?: number | null;
  academicTermStatus?: AcademicTermStatus | null;
  assigneeId: number;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  createdAt: string;
  createdBy: number;
  readiness?: JudgeBoardReadiness | null;
  teamsCount?: number | null;
  submittedSheetsCount?: number | null;
  draftSheetsCount?: number | null;
  problemReleaseAt?: string | null;
  problemCloseAt?: string | null;
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

export interface MentorBoardTeam {
  slotId: number;
  slotNumber: number;
  teamId: number;
  teamName: string;
  teamStatus?: string | null;
}

export async function fetchMentorBoardTeams(boardId: number) {
  const { data } = await apiClient.get<ApiResponse<MentorBoardTeam[]>>(
    `/v1/mentors/boards/${boardId}/teams`
  );
  return data.data ?? [];
}

export async function fetchJudgeBoardTeams(boardId: number) {
  const { data } = await apiClient.get<ApiResponse<MentorBoardTeam[]>>(
    `/v1/judges/boards/${boardId}/teams`
  );
  return data.data ?? [];
}
