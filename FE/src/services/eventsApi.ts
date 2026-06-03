import type { ApiResponse } from "../types/api";
import type { EventListItem } from "../types/entities";
import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";
import { demoEvent, demoPublicEvents } from "../mocks/hackathonDemoData";

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

const fallbackDetails: EventDetail[] = demoPublicEvents.map((event) => ({
  id: event.id,
  name: event.name,
  status: event.status,
  startDate: event.startDate,
  endDate: event.endDate,
  minTeamSize: event.id === 2 ? 2 : demoEvent.minTeamSize,
  maxTeamSize: event.id === 3 ? 4 : demoEvent.maxTeamSize,
  maxTeams: event.id === 1 ? demoEvent.quota : 40
}));

export async function fetchPublicEvents(): Promise<{ data: EventListItem[]; usingFallback: boolean }> {
  return withApiFallback(async () => {
    const { data } = await apiClient.get<ApiResponse<EventListItem[]>>("/v1/events");
    return data.data ?? [];
  }, demoPublicEvents);
}

export async function fetchEventDetail(
  eventId: string
): Promise<{ data: EventDetail | null; usingFallback: boolean }> {
  const fallback = fallbackDetails.find((item) => String(item.id) === eventId) ?? null;
  return withApiFallback(async () => {
    const { data } = await apiClient.get<ApiResponse<EventDetail>>(`/v1/events/${eventId}`);
    return data.data ?? null;
  }, fallback);
}

export interface UpdateEventPayload {
  name: string;
  maxTeams: number;
}

export async function updateEvent(eventId: string, payload: UpdateEventPayload) {
  const { data } = await apiClient.put<ApiResponse<EventDetail>>(`/v1/admin/events/${eventId}`, payload);
  return data.data;
}
