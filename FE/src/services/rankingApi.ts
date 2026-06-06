import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export interface RankingTeamEntry {
  rank: number;
  teamId: number;
  teamName: string;
  slotNumber?: number | null;
  averageScore: number;
  submittedJudgeCount: number;
}

export interface BoardRanking {
  boardId: number;
  boardName: string;
  roundId?: number | null;
  roundName?: string | null;
  eventId?: number | null;
  published: boolean;
  calculatedAt?: string | null;
  publishedAt?: string | null;
  teamCount: number;
  entries: RankingTeamEntry[];
}

export interface EventRankings {
  eventId: number;
  eventName: string;
  anyPublished: boolean;
  boards: BoardRanking[];
}

export interface PublicEventResults {
  eventId: number;
  eventName: string;
  published: boolean;
  publishedAt?: string | null;
  boards: BoardRanking[];
}

export interface CalculateRankingResult {
  boardsCalculated: number;
  teamsRanked: number;
  newlyPublishedBoards?: number;
  message: string;
}

export async function fetchBoardRanking(boardId: number) {
  const { data } = await apiClient.get<ApiResponse<BoardRanking>>(
    `/v1/admin/boards/${boardId}/rankings`
  );
  if (!data.data) throw new Error(data.message || "Không tải được xếp hạng.");
  return data.data;
}

export async function calculateBoardRanking(boardId: number, force = false) {
  const { data } = await apiClient.post<ApiResponse<BoardRanking>>(
    `/v1/admin/boards/${boardId}/rankings/calculate`,
    null,
    { params: { force } }
  );
  if (!data.data) throw new Error(data.message || "Tính xếp hạng thất bại.");
  return data.data;
}

export async function calculateRoundRanking(roundId: number, force = false) {
  const { data } = await apiClient.post<ApiResponse<CalculateRankingResult>>(
    `/v1/admin/rounds/${roundId}/rankings/calculate`,
    null,
    { params: { force } }
  );
  if (!data.data) throw new Error(data.message || "Tính xếp hạng thất bại.");
  return data.data;
}

export async function fetchEventRankings(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<EventRankings>>(
    `/v1/admin/events/${eventId}/rankings`
  );
  if (!data.data) throw new Error(data.message || "Không tải được xếp hạng.");
  return data.data;
}

export async function publishBoardRanking(boardId: number) {
  const { data } = await apiClient.post<ApiResponse<BoardRanking>>(
    `/v1/admin/boards/${boardId}/rankings/publish`
  );
  if (!data.data) throw new Error(data.message || "Công bố thất bại.");
  return data.data;
}

export async function publishEventRankings(eventId: number) {
  const { data } = await apiClient.post<ApiResponse<CalculateRankingResult>>(
    `/v1/admin/events/${eventId}/rankings/publish`
  );
  if (!data.data) throw new Error(data.message || "Công bố thất bại.");
  return data.data;
}

export async function fetchPublicEventResults(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<PublicEventResults>>(
    `/v1/events/${eventId}/results`
  );
  if (!data.data) throw new Error(data.message || "Không tải được kết quả.");
  return data.data;
}
