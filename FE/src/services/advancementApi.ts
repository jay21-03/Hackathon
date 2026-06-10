import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export interface AdvancementCandidate {
  teamId: number;
  teamName: string;
  fromBoardId: number;
  fromBoardName: string;
  rank: number;
  averageScore: number;
}

export interface AdvancementPreview {
  eventId: number;
  fromRoundId: number;
  toRoundId: number;
  topNPerBoard: number;
  /** Top-N per board — gợi ý chọn nhanh. */
  candidates: AdvancementCandidate[];
  /** Toàn bộ đội có BXH đã công bố ở vòng nguồn. */
  eligibleTeams?: AdvancementCandidate[];
}

export interface AdvancementRecord {
  id: number;
  fromRoundId: number;
  fromBoardId: number;
  toRoundId: number;
  toBoardId: number;
  teamId: number;
  teamName: string;
  basisRank: number;
  basisScore: number;
  createdAt: string;
}

export async function previewAdvancements(
  eventId: number,
  params: { fromRoundId: number; toRoundId: number; topNPerBoard?: number }
) {
  const { data } = await apiClient.get<ApiResponse<AdvancementPreview>>(
    `/v1/admin/events/${eventId}/advancements/preview`,
    { params }
  );
  if (!data.data) throw new Error(data.message || "Không xem trước được danh sách vào chung kết.");
  return data.data;
}

export async function executeAdvancements(
  eventId: number,
  body: {
    fromRoundId: number;
    toRoundId: number;
    topNPerBoard?: number;
    targetBoardId?: number;
    teamIds?: number[];
  }
) {
  const { data } = await apiClient.post<ApiResponse<{
    teamsAdvanced: number;
    slotsAssigned: number;
    advancements: AdvancementRecord[];
  }>>(`/v1/admin/events/${eventId}/advancements/execute`, body);
  if (!data.data) throw new Error(data.message || "Chuyển đội vào chung kết thất bại.");
  return data.data;
}

export async function fetchAdvancements(eventId: number, toRoundId: number) {
  const { data } = await apiClient.get<ApiResponse<AdvancementRecord[]>>(
    `/v1/admin/events/${eventId}/advancements`,
    { params: { toRoundId } }
  );
  return data.data ?? [];
}
