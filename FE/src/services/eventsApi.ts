import type { ApiResponse } from "../types/api";
import type { EventListItem } from "../types/entities";
import { apiClient } from "./apiClient";

export interface EventDetail {
  id: number;
  name: string;
  description?: string | null;
  rules?: string | null;
  status: string;
  startDate: string;
  endDate: string;
  registrationStartAt?: string;
  registrationEndAt?: string;
  minTeamSize: number;
  maxTeamSize: number;
  maxTeams: number;
  academicTermId?: number;
  academicTermCode?: string;
  academicTermName?: string;
}

export async function fetchPublicEvents(academicTermId?: number): Promise<EventListItem[]> {
  const { data } = await apiClient.get<ApiResponse<EventListItem[]>>("/v1/events", {
    params: academicTermId ? { academicTermId } : undefined
  });
  return data.data ?? [];
}

export async function fetchEventDetail(eventId: string): Promise<EventDetail | null> {
  const { data } = await apiClient.get<ApiResponse<EventDetail>>(`/v1/events/${eventId}`);
  return data.data ?? null;
}

export interface UpdateEventPayload {
  name: string;
  description?: string;
  rules?: string;
  maxTeams: number;
  startDate?: string;
  endDate?: string;
  registrationStartAt?: string;
  registrationEndAt?: string;
  academicTermId?: number;
}

export async function updateEvent(eventId: string, payload: UpdateEventPayload) {
  const { data } = await apiClient.put<ApiResponse<EventDetail>>(`/v1/admin/events/${eventId}`, payload);
  return data.data;
}

export async function openEventRegistration(eventId: string) {
  const { data } = await apiClient.post<ApiResponse<EventDetail>>(
    `/v1/admin/events/${eventId}/open-registration`
  );
  if (!data.data) {
    throw new Error(data.message || "Không mở được đăng ký");
  }
  return data.data;
}

async function postLifecycleAction(eventId: string, action: string) {
  const { data } = await apiClient.post<ApiResponse<EventDetail>>(
    `/v1/admin/events/${eventId}/${action}`
  );
  if (!data.data) {
    throw new Error(data.message || "Không thực hiện được thao tác vòng đời cuộc thi");
  }
  return data.data;
}

export function closeEventRegistration(eventId: string) {
  return postLifecycleAction(eventId, "close-registration");
}

export function startCompetition(eventId: string) {
  return postLifecycleAction(eventId, "start-competition");
}

export function completeCompetition(eventId: string) {
  return postLifecycleAction(eventId, "complete-competition");
}

export function cancelEvent(eventId: string) {
  return postLifecycleAction(eventId, "cancel");
}

export interface CreateEventPayload {
  name: string;
  description?: string;
  rules?: string;
  startDate: string;
  endDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
  maxTeams: number;
  academicTermId: number;
}

export async function createEvent(payload: CreateEventPayload) {
  const { data } = await apiClient.post<ApiResponse<EventDetail>>("/v1/admin/events", payload);
  if (!data.data) {
    throw new Error(data.message || "Tạo cuộc thi thất bại");
  }
  return data.data;
}
