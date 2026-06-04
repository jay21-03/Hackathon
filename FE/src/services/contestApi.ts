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
    throw new Error(data.message || "Tạo đề thi that bai");
  }
  return data.data;
}

export async function updateProblem(problemId: number, payload: Partial<CreateProblemPayload>) {
  const { data } = await apiClient.put<ApiResponse<ProblemResponse>>(
    `/v1/admin/problems/${problemId}`,
    payload
  );
  if (!data.data) {
    throw new Error(data.message || "Cập nhật đề thi that bai");
  }
  return data.data;
}

export interface CreateRoundPayload {
  name: string;
  roundType: "GROUP_STAGE" | "FINAL";
  roundOrder: number;
  startAt: string;
  endAt: string;
}

export async function createRound(eventId: number, payload: CreateRoundPayload) {
  const { data } = await apiClient.post<ApiResponse<RoundResponse>>(
    `/v1/admin/events/${eventId}/rounds`,
    payload
  );
  if (!data.data) {
    throw new Error(data.message || "Tạo vòng thi thất bại");
  }
  return data.data;
}

export type UpdateRoundPayload = Partial<CreateRoundPayload>;

export async function fetchRound(roundId: number) {
  const { data } = await apiClient.get<ApiResponse<RoundResponse>>(`/v1/admin/rounds/${roundId}`);
  return data.data ?? null;
}

export async function updateRound(roundId: number, payload: UpdateRoundPayload) {
  const { data } = await apiClient.put<ApiResponse<RoundResponse>>(
    `/v1/admin/rounds/${roundId}`,
    payload
  );
  if (!data.data) {
    throw new Error(data.message || "Cập nhật vòng thi thất bại");
  }
  return data.data;
}

export interface CreateBoardPayload {
  name: string;
  boardOrder: number;
  description?: string;
}

export async function createBoard(roundId: number, payload: CreateBoardPayload) {
  const { data } = await apiClient.post<ApiResponse<BoardResponse>>(
    `/v1/admin/rounds/${roundId}/boards`,
    payload
  );
  if (!data.data) {
    throw new Error(data.message || "Tạo bảng thi thất bại");
  }
  return data.data;
}

export type UpdateBoardPayload = Partial<CreateBoardPayload>;

export async function updateBoard(boardId: number, payload: UpdateBoardPayload) {
  const { data } = await apiClient.put<ApiResponse<BoardResponse>>(
    `/v1/admin/boards/${boardId}`,
    payload
  );
  if (!data.data) {
    throw new Error(data.message || "Cập nhật bảng thi thất bại");
  }
  return data.data;
}

export async function createBoardSlot(boardId: number, teamNumber: number) {
  const { data } = await apiClient.post<ApiResponse<BoardSlotResponse>>(
    `/v1/admin/boards/${boardId}/slots`,
    { teamNumber }
  );
  if (!data.data) {
    throw new Error(data.message || "Tạo slot thất bại");
  }
  return data.data;
}

export async function moveTeamBetweenSlots(roundId: number, fromSlotId: number, toSlotId: number) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/v1/admin/rounds/${roundId}/boards/slots/move`,
    { fromSlotId, toSlotId }
  );
  return data.data;
}

export async function swapBoardSlots(roundId: number, slotAId: number, slotBId: number) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/v1/admin/rounds/${roundId}/boards/slots/swap`,
    { slotAId, slotBId }
  );
  return data.data;
}
