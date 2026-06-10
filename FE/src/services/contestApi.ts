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
  closeAt?: string | null;
}

export interface RoundCountdownResponse {
  status: "NOT_STARTED" | "RUNNING" | "ENDED";
  remainingSeconds: number;
}

/** BTC — cần role ORGANIZER */
export async function fetchEventRounds(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<RoundResponse[]>>(
    `/v1/admin/events/${eventId}/rounds`
  );
  return data.data ?? [];
}

/** Thí sinh / countdown — không cần admin */
export async function fetchPublicEventRounds(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<RoundResponse[]>>(
    `/v1/events/${eventId}/rounds`
  );
  return data.data ?? [];
}

export interface MyBoardPeer {
  teamId: number;
  teamName: string;
  slotNumber: number;
}

export interface MyBoardResponse {
  assigned: boolean;
  reason?: "NO_TEAM" | "TEAM_NOT_CONFIRMED" | "NOT_ASSIGNED";
  teamId?: number;
  roundId?: number;
  roundName?: string;
  boardId?: number;
  boardName?: string;
  slotNumber?: number;
  peers?: MyBoardPeer[];
}

export interface MyProblemResponse {
  available: boolean;
  reason?: string;
  releaseAt?: string;
  closeAt?: string;
  problem?: ProblemResponse;
}

export async function fetchMyBoard(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<MyBoardResponse>>(
    `/v1/my/board`,
    { params: { eventId } }
  );
  return data.data ?? { assigned: false, reason: "NOT_ASSIGNED" };
}

export async function fetchMyProblem(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<MyProblemResponse>>(
    `/v1/my/problem`,
    { params: { eventId } }
  );
  return data.data ?? { available: false, reason: "NOT_ASSIGNED" };
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
  payload?: { boardIds?: number[]; slotIds?: number[]; chunkSize?: number; seed?: number | string }
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
  forceReplace = false,
  idempotencyKey?: string
) {
  const headers = idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined;
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/v1/admin/rounds/${roundId}/boards/slots/${slotId}/assign`,
    { teamId, forceReplace },
    { headers }
  );
  return data.data;
}

export async function unassignTeamFromSlot(roundId: number, slotId: number) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/v1/admin/rounds/${roundId}/boards/slots/${slotId}/unassign`
  );
  return data.data;
}

export async function deleteBoardSlot(slotId: number) {
  await apiClient.delete(`/v1/admin/board-slots/${slotId}`);
}

export interface CreateProblemPayload {
  title: string;
  description?: string;
  attachmentUrl?: string | null;
  externalLink?: string;
  releaseAt: string;
  closeAt: string;
}

export async function createProblem(
  boardId: number,
  payload: CreateProblemPayload,
  idempotencyKey?: string
) {
  const { data } = await apiClient.post<ApiResponse<ProblemResponse>>(
    `/v1/admin/boards/${boardId}/problems`,
    payload,
    idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : undefined
  );
  if (!data.data) {
    throw new Error(data.message || "Tạo đề thi thất bại");
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

export async function deleteProblem(problemId: number) {
  await apiClient.delete(`/v1/admin/problems/${problemId}`);
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

export async function deleteRound(roundId: number) {
  await apiClient.delete(`/v1/admin/rounds/${roundId}`);
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

export async function deleteBoard(boardId: number) {
  await apiClient.delete(`/v1/admin/boards/${boardId}`);
}

export async function createBoardSlot(boardId: number, teamNumber: number) {
  const { data } = await apiClient.post<ApiResponse<BoardSlotResponse>>(
    `/v1/admin/boards/${boardId}/slots`,
    { teamNumber }
  );
  if (!data.data) {
    throw new Error(data.message || "Tạo vị trí thất bại");
  }
  return data.data;
}

export async function moveTeamBetweenSlots(
  roundId: number,
  fromSlotId: number,
  toSlotId: number,
  idempotencyKey?: string
) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/v1/admin/rounds/${roundId}/boards/slots/move`,
    { fromSlotId, toSlotId },
    idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : undefined
  );
  return data.data;
}

export async function swapBoardSlots(
  roundId: number,
  slotAId: number,
  slotBId: number,
  idempotencyKey?: string
) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/v1/admin/rounds/${roundId}/boards/slots/swap`,
    { slotAId, slotBId },
    idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : undefined
  );
  return data.data;
}
