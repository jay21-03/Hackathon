import { apiClient } from "./apiClient";
import type { ApiResponse } from "../types/api";

export interface AuditLogItem {
  id: number;
  actorId?: number | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  beforeState?: string | null;
  afterState?: string | null;
  createdAt: string;
}

export async function fetchEventAuditLogs(eventId: number, limit = 50) {
  const { data } = await apiClient.get<ApiResponse<AuditLogItem[]>>(
    `/v1/admin/events/${eventId}/audit-logs`,
    { params: { limit } }
  );
  return data.data ?? [];
}
