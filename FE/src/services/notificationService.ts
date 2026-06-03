import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";
import { demoAnnouncements } from "../mocks/hackathonDemoData";

export async function fetchNotifications(eventId: string) {
  return withApiFallback(() => apiClient.get(`/events/${eventId}/notifications`).then((r) => r.data), demoAnnouncements);
}

export async function postNotification(eventId: string, notification: any) {
  try {
    const res = await apiClient.post(`/events/${eventId}/notifications`, notification);
    return { data: res.data, usingFallback: false };
  } catch {
    return { data: notification, usingFallback: true };
  }
}
