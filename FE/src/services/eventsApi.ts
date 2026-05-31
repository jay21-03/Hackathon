import type { ApiResponse } from "../types/api";
import type { EventListItem } from "../types/entities";
import { apiClient } from "./apiClient";

export async function fetchPublicEvents(): Promise<EventListItem[]> {
  const { data } = await apiClient.get<ApiResponse<EventListItem[]>>(
    "/v1/events"
  );
  return data.data ?? [];
}
