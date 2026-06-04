import type { ApiResponse } from "../types/api";
import type { EventListItem } from "../types/entities";
import { apiClient } from "./apiClient";

export interface EventDetail {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  minTeamSize: number;
  maxTeamSize: number;
  maxTeams: number;
}

export async function fetchPublicEvents(): Promise<EventListItem[]> {
  const { data } = await apiClient.get<ApiResponse<EventListItem[]>>("/v1/events");
  return data.data ?? [];
}

export async function fetchEventDetail(eventId: string): Promise<EventDetail | null> {
  const { data } = await apiClient.get<ApiResponse<EventDetail>>(`/v1/events/${eventId}`);
  return data.data ?? null;
}

export interface UpdateEventPayload {
  name: string;
  maxTeams: number;
}

export async function updateEvent(eventId: string, payload: UpdateEventPayload) {
  const { data } = await apiClient.put<ApiResponse<EventDetail>>(`/v1/admin/events/${eventId}`, payload);
  return data.data;
}
