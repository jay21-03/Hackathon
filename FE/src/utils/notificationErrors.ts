import { getApiErrorMessage } from "./apiError";

const notificationErrorMap: Record<string, string> = {
  NOTIFICATION_NOT_FOUND: "Thông báo không tồn tại hoặc đã bị xóa.",
  NOTIFICATION_FORBIDDEN: "Bạn không có quyền truy cập thông báo này."
};

export function mapNotificationErrorMessage(message: string) {
  const trimmed = message.trim();
  for (const [code, label] of Object.entries(notificationErrorMap)) {
    if (trimmed.includes(code)) {
      return label;
    }
  }
  return trimmed || "Không thực hiện được thao tác thông báo.";
}

export function resolveNotificationError(error: unknown, fallback = "Không tải được thông báo.") {
  return mapNotificationErrorMessage(getApiErrorMessage(error, fallback));
}
