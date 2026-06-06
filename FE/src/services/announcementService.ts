import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export type AnnouncementAudience = "ALL" | "PARTICIPANTS" | "STAFF";

export interface AnnouncementItem {
  id: number;
  eventId: number;
  eventName?: string | null;
  title: string;
  content: string;
  publishedAt?: string | null;
  createdBy?: number | null;
  createdAt: string;
  recipientCount?: number;
  audience?: AnnouncementAudience | null;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  publishNow?: boolean;
  audience?: AnnouncementAudience;
}

export async function fetchEventAnnouncements(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<AnnouncementItem[]>>(
    `/v1/admin/events/${eventId}/announcements`
  );
  if (!data.data) throw new Error(data.message || "Không tải được thông báo chung.");
  return data.data;
}

export async function createEventAnnouncement(eventId: number, payload: CreateAnnouncementPayload) {
  const { data } = await apiClient.post<ApiResponse<AnnouncementItem>>(
    `/v1/admin/events/${eventId}/announcements`,
    payload
  );
  if (!data.data) throw new Error(data.message || "Không gửi được thông báo.");
  return data.data;
}

export async function fetchPublishedAnnouncements(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<AnnouncementItem[]>>(
    `/v1/events/${eventId}/announcements`
  );
  if (!data.data) throw new Error(data.message || "Không tải được thông báo.");
  return data.data;
}
