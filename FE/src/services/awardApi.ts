import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export type AwardType = "RANK" | "CUSTOM";

export interface TeamAward {
  id: number;
  eventId: number;
  roundId?: number | null;
  awardCategoryId: number;
  awardCategoryName: string;
  awardCategoryCode: string;
  teamId: number;
  teamName: string;
  teamStatus?: string | null;
  awardedBy?: number | null;
  awardedAt: string;
  note?: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AwardCategory {
  id: number;
  eventId: number;
  roundId?: number | null;
  name: string;
  code: string;
  description?: string | null;
  awardType: AwardType;
  rankOrder?: number | null;
  maxWinners: number;
  prizeValue?: string | null;
  sortOrder: number;
  isActive: boolean;
  active?: boolean;
  winnerCount: number;
  winners: TeamAward[];
  createdAt: string;
  updatedAt: string;
}

export interface EventAwards {
  eventId: number;
  eventName: string;
  published: boolean;
  publishedAt?: string | null;
  categories: AwardCategory[];
}

export interface CreateAwardCategoryPayload {
  name: string;
  code: string;
  description?: string;
  awardType: AwardType;
  rankOrder?: number;
  maxWinners?: number;
  prizeValue?: string;
  sortOrder?: number;
  roundId?: number | null;
  isActive?: boolean;
}

export function isAwardCategoryActive(category: AwardCategory) {
  return category.isActive ?? category.active ?? true;
}

export interface UpdateAwardCategoryPayload {
  name?: string;
  code?: string;
  description?: string;
  awardType?: AwardType;
  rankOrder?: number;
  maxWinners?: number;
  prizeValue?: string;
  sortOrder?: number;
  roundId?: number | null;
  clearRoundId?: boolean;
  isActive?: boolean;
}

export async function fetchAwardCategories(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<AwardCategory[]>>(
    `/v1/admin/events/${eventId}/award-categories`
  );
  return data.data ?? [];
}

export async function createAwardCategory(eventId: number, payload: CreateAwardCategoryPayload) {
  const { data } = await apiClient.post<ApiResponse<AwardCategory>>(
    `/v1/admin/events/${eventId}/award-categories`,
    payload
  );
  if (!data.data) throw new Error(data.message || "Tạo loại giải thất bại.");
  return data.data;
}

export async function updateAwardCategory(categoryId: number, payload: UpdateAwardCategoryPayload) {
  const { data } = await apiClient.put<ApiResponse<AwardCategory>>(
    `/v1/admin/award-categories/${categoryId}`,
    payload
  );
  if (!data.data) throw new Error(data.message || "Cập nhật loại giải thất bại.");
  return data.data;
}

export async function deleteAwardCategory(categoryId: number) {
  await apiClient.delete(`/v1/admin/award-categories/${categoryId}`);
}

export async function fetchEventAwards(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<EventAwards>>(
    `/v1/admin/events/${eventId}/awards`
  );
  if (!data.data) throw new Error(data.message || "Không tải được danh sách giải.");
  return data.data;
}

export async function assignTeamAward(
  eventId: number,
  payload: { awardCategoryId: number; teamId: number; note?: string; roundId?: number }
) {
  const { data } = await apiClient.post<ApiResponse<TeamAward>>(
    `/v1/admin/events/${eventId}/awards`,
    payload
  );
  if (!data.data) throw new Error(data.message || "Gán giải thất bại.");
  return data.data;
}

export async function removeTeamAward(awardId: number) {
  await apiClient.delete(`/v1/admin/awards/${awardId}`);
}

export async function publishEventAwards(eventId: number) {
  const { data } = await apiClient.post<ApiResponse<{ awardsPublished: number; published: boolean }>>(
    `/v1/admin/events/${eventId}/awards/publish`
  );
  if (!data.data) throw new Error(data.message || "Công bố giải thất bại.");
  return data.data;
}

export async function unpublishEventAwards(eventId: number) {
  const { data } = await apiClient.post<ApiResponse<{ awardsPublished: number; published: boolean }>>(
    `/v1/admin/events/${eventId}/awards/unpublish`
  );
  if (!data.data) throw new Error(data.message || "Thu hồi công bố giải thất bại.");
  return data.data;
}

export async function suggestAwardsFromRanking(
  eventId: number,
  payload?: { roundId?: number; boardId?: number }
) {
  const { data } = await apiClient.post<
    ApiResponse<{ suggestions: TeamAward[]; created: number; message: string }>
  >(`/v1/admin/events/${eventId}/awards/suggest-from-ranking`, payload ?? {});
  if (!data.data) throw new Error(data.message || "Gợi ý giải từ BXH thất bại.");
  return data.data;
}

export async function fetchPublicEventAwards(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<EventAwards>>(`/v1/events/${eventId}/awards`);
  if (!data.data) throw new Error(data.message || "Không tải được kết quả trao giải.");
  return data.data;
}

export const DEFAULT_AWARD_CATEGORIES: CreateAwardCategoryPayload[] = [
  {
    name: "Giải nhất",
    code: "FIRST_PRIZE",
    awardType: "RANK",
    rankOrder: 1,
    maxWinners: 1,
    sortOrder: 1
  },
  {
    name: "Giải nhì",
    code: "SECOND_PRIZE",
    awardType: "RANK",
    rankOrder: 2,
    maxWinners: 1,
    sortOrder: 2
  },
  {
    name: "Giải ba",
    code: "THIRD_PRIZE",
    awardType: "RANK",
    rankOrder: 3,
    maxWinners: 1,
    sortOrder: 3
  },
  {
    name: "Giải khuyến khích",
    code: "ENCOURAGEMENT",
    awardType: "CUSTOM",
    maxWinners: 5,
    sortOrder: 4
  }
];
