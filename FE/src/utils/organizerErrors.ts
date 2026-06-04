import { getApiErrorMessage } from "./apiError";

const organizerErrorMap: Record<string, string> = {
  ONLY_ORGANIZER:
    "Tài khoản chưa có quyền ban tổ chức. Gán role ORGANIZER rồi đăng nhập lại.",
  "Organizer role required":
    "Tài khoản chưa có quyền ban tổ chức. Gán role ORGANIZER rồi đăng nhập lại.",
  TARGET_NOT_MENTOR: "Người được chọn chưa có role MENTOR.",
  TARGET_NOT_JUDGE: "Người được chọn chưa có role JUDGE.",
  SLOT_OCCUPIED: "Slot đã có đội — bật «Ghi đè» hoặc gỡ đội trước.",
  TEAM_NOT_CONFIRMED: "Chỉ gán đội ở trạng thái Đã xác nhận.",
  TEAM_ALREADY_ASSIGNED: "Đội đã được gán vào một slot khác trong vòng này.",
  TEAM_EVENT_MISMATCH: "Đội không thuộc cuộc thi của vòng đang chọn.",
  FROM_SLOT_EMPTY: "Slot nguồn đang trống.",
  TO_SLOT_OCCUPIED: "Slot đích đã có đội.",
  SLOT_EMPTY: "Slot đang trống, không cần gỡ.",
  SLOT_HAS_TEAM: "Chỉ xóa được slot trống — gỡ đội trước.",
  "startAt must be before endAt": "Thời gian kết thúc vòng phải sau thời gian bắt đầu.",
  "closeAt must be after releaseAt": "Thời gian đóng đề phải sau thời gian mở đề.",
  "Registration end date has passed": "Đã qua hạn đóng đăng ký — cập nhật ngày đăng ký trước.",
  "teamId must not be null": "Chọn đội để gán vào slot.",
  "userId must not be null": "Chọn người để phân công.",
  "fromSlotId must not be null": "Chọn slot nguồn.",
  "toSlotId must not be null": "Chọn slot đích."
};

export function resolveOrganizerApiError(error: unknown, fallback: string) {
  return mapOrganizerErrorMessage(getApiErrorMessage(error, fallback));
}

export function mapOrganizerErrorMessage(message: string) {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes("forbidden") || lower.includes("organizer role required")) {
    return organizerErrorMap.ONLY_ORGANIZER;
  }
  for (const [key, vi] of Object.entries(organizerErrorMap)) {
    if (trimmed.includes(key)) return vi;
  }
  return trimmed;
}
