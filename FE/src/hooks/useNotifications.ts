import { useQuery } from "@tanstack/react-query";
import { enableNotifications } from "../config/features";
import { queryKeys } from "../lib/queryKeys";
import {
  fetchMyNotifications,
  fetchUnreadNotificationCount,
  type NotificationType
} from "../services/notificationService";

export function useNotifications(page = 0, size = 50, type?: NotificationType | null) {
  return useQuery({
    queryKey: queryKeys.notifications.list(page, size, type ?? undefined),
    queryFn: () => fetchMyNotifications(page, size, type ?? undefined),
    enabled: enableNotifications
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: fetchUnreadNotificationCount,
    enabled: enableNotifications,
    refetchInterval: 60_000
  });
}
