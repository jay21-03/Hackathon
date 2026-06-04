import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export interface RoundResponse {
  id: number;
  eventId: number;
  name: string;
  roundType: string;
  roundOrder: number;
  startAt: string;
  endAt: string;
  status: string;
}

export interface BoardResponse {
  id: number;
  roundId: number;
  name: string;
  boardOrder: number;
  description?: string | null;
  status: string;
}

export interface BoardSlotResponse {
  id: number;
  roundId: number;
  boardId: number;
  teamNumber: number;
  teamId: number | null;
}

export interface ProblemResponse {
  id: number;
  boardId: number;
  title: string;
  description?: string | null;
  attachmentUrl?: string | null;
  externalLink?: string | null;
  releaseAt: string;
}

export interface RoundCountdownResponse {
  status: "NOT_STARTED" | "RUNNING" | "ENDED";
  remainingSeconds: number;
}

export async function fetchEventRounds(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<RoundResponse[]>>(
    `/v1/admin/events/${eventId}/rounds`
  );
  return data.data ?? [];
}

export async function fetchRoundBoards(roundId: number) {
  const { data } = await apiClient.get<ApiResponse<BoardResponse[]>>(
    `/v1/admin/rounds/${roundId}/boards`
  );
  return data.data ?? [];
}

export async function fetchBoardSlots(boardId: number) {
  const { data } = await apiClient.get<ApiResponse<BoardSlotResponse[]>>(
    `/v1/admin/boards/${boardId}/slots`
  );
  return data.data ?? [];
}

export async function fetchBoardProblems(boardId: number) {
  const { data } = await apiClient.get<ApiResponse<ProblemResponse[]>>(
    `/v1/admin/boards/${boardId}/problems`
  );
  return data.data ?? [];
}

export async function fetchProblem(problemId: number) {
  const { data } = await apiClient.get<ApiResponse<ProblemResponse>>(
    `/v1/admin/problems/${problemId}`
  );
  return data.data ?? null;
}

export async function fetchRoundCountdown(roundId: number) {
  const { data } = await apiClient.get<ApiResponse<RoundCountdownResponse>>(
    `/v1/rounds/${roundId}/countdown`
  );
  return data.data ?? null;
}

export async function randomAssignTeams(
  roundId: number,
  payload?: { boardIds?: number[]; slotIds?: number[]; seed?: number }
) {
  const { data } = await apiClient.post<ApiResponse<{ assignedCount: number }>>(
    `/v1/admin/rounds/${roundId}/boards/assign/random`,
    payload ?? {}
  );
  return data.data;
}

export async function assignTeamToSlot(
  roundId: number,
  slotId: number,
  teamId: number,
  forceReplace = false
) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/v1/admin/rounds/${roundId}/boards/slots/${slotId}/assign`,
    { teamId, forceReplace }
  );
  return data.data;
}

export interface CreateProblemPayload {
  title: string;
  description?: string;
  attachmentUrl?: string;
  externalLink?: string;
  releaseAt: string;
}

export async function createProblem(boardId: number, payload: CreateProblemPayload) {
  const { data } = await apiClient.post<ApiResponse<ProblemResponse>>(
    `/v1/admin/boards/${boardId}/problems`,
    payload
  );
  if (!data.data) {
    throw new Error(data.message || "Tao de thi that bai");
  }
  return data.data;
}

export async function updateProblem(problemId: number, payload: Partial<CreateProblemPayload>) {
  const { data } = await apiClient.put<ApiResponse<ProblemResponse>>(
    `/v1/admin/problems/${problemId}`,
    payload
  );
  if (!data.data) {
    throw new Error(data.message || "Cap nhat de thi that bai");
  }
  return data.data;
}
