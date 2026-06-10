import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export type NotificationType =
  | "TEAM_INVITE"
  | "STAFF_INVITE"
  | "RANKING_PUBLISHED"
  | "ANNOUNCEMENT"
  | "TEAM_STATUS"
  | "SLOT_ASSIGNED"
  | "SUBMISSION"
  | "PROBLEM_RELEASED"
  | "BOARD_READY_TO_SCORE"
  | "GENERAL";

export interface NotificationItem {
  id: number;
  eventId?: number | null;
  eventName?: string | null;
  type?: NotificationType | null;
  title: string;
  content: string;
  linkUrl?: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationList {
  items: NotificationItem[];
  unreadCount: number;
  total: number;
  page: number;
  size: number;
}

export async function fetchMyNotifications(page = 0, size = 50, type?: NotificationType) {
  const { data } = await apiClient.get<ApiResponse<NotificationList>>("/v1/me/notifications", {
    params: { page, size, ...(type ? { type } : {}) }
  });
  if (!data.data) throw new Error(data.message || "Không tải được thông báo.");
  return data.data;
}

export async function fetchUnreadNotificationCount() {
  const { data } = await apiClient.get<ApiResponse<number>>("/v1/me/notifications/unread-count");
  if (data.data == null) throw new Error(data.message || "Không tải được số thông báo.");
  return data.data;
}

export async function markNotificationRead(notificationId: number) {
  const { data } = await apiClient.put<ApiResponse<NotificationItem>>(
    `/v1/me/notifications/${notificationId}/read`
  );
  if (!data.data) throw new Error(data.message || "Không cập nhật được thông báo.");
  return data.data;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.put<ApiResponse<NotificationList>>("/v1/me/notifications/read-all");
  if (!data.data) throw new Error(data.message || "Không cập nhật được thông báo.");
  return data.data;
}
