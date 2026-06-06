import { getApiErrorMessage } from "./apiError";

const organizerErrorMap: Record<string, string> = {
  DATA_INTEGRITY_VIOLATION:
    "Không thể gỡ vì còn dữ liệu liên quan (ví dụ phiếu chấm). Hệ thống sẽ tự xóa phiếu nháp khi gỡ giám khảo.",
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
  ROUND_NOT_PLANNED:
    "Vòng đã vào giai đoạn chấm điểm hoặc đã kết thúc — không thể phân công ngẫu nhiên.",
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
  "toSlotId must not be null": "Chọn slot đích.",
  RUBRIC_LOCKED: "Tiêu chí chấm đã khóa — có phiếu chấm đã nộp, không thể sửa.",
  RUBRIC_NOT_CONFIGURED: "Chưa cấu hình tiêu chí chấm cho vòng này.",
  INVALID_WEIGHT_SUM: "Tổng trọng số phải bằng 100%.",
  DUPLICATE_CRITERIA: "Mã hoặc tên tiêu chí bị trùng trong vòng.",
  INVALID_LEVEL_DESCRIPTORS: "Mỗi tiêu chí cần đúng 4 mức mô tả.",
  SCORE_OUT_OF_RANGE: "Điểm nằm ngoài thang cho phép.",
  INCOMPLETE_SCORE_SHEET: "Chưa nhập đủ điểm cho mọi tiêu chí.",
  JUDGE_NOT_ASSIGNED: "Giám khảo chưa được phân công cho bảng này.",
  ONLY_JUDGE: "Tài khoản chưa có quyền giám khảo.",
  ALREADY_SUBMITTED: "Phiếu chấm đã nộp — không thể sửa.",
  RUBRIC_EXISTS_USE_REPLACE: "Tiêu chí chấm đã tồn tại — chọn thay thế bản hiện tại để cập nhật.",
  CRITERIA_NOT_IN_ROUND: "Tiêu chí không thuộc vòng đang chấm.",
  TEAM_DISQUALIFIED: "Đội bị loại — không thể chấm.",
  TEAM_NOT_IN_BOARD: "Đội không thuộc bảng này.",
  INVALID_REPOSITORY_URL: "Link phải là GitHub hoặc GitLab hợp lệ.",
  REPOSITORY_URL_REQUIRED: "Nhập link repository trước khi nộp.",
  SUBMISSION_DEADLINE_PASSED: "Đã qua hạn nộp bài.",
  SUBMISSION_ALREADY_SUBMITTED: "Bài đã nộp — không thể sửa hoặc nộp lại.",
  NOT_RELEASED: "Đề chưa mở — chưa thể nộp bài.",
  PROBLEM_CLOSED: "Đề đã đóng — không thể nộp bài.",
  PROBLEM_UNAVAILABLE: "Chưa thể nộp bài trong thời điểm hiện tại.",
  EVENT_ACCESS_DENIED: "Bạn không có quyền quản lý cuộc thi này.",
  STAFF_INVITATION_ALREADY_PENDING: "Đã có lời mời đang chờ cho email và vai trò này trên bảng.",
  STAFF_INVITE_EMAIL_MISMATCH: "Email đăng nhập không khớp email được mời.",
  RANKING_PUBLISHED: "Bảng đã công bố — dùng «Tính lại (force)» để tính lại.",
  RANKING_NOT_CALCULATED: "Chưa tính xếp hạng — tính xếp hạng trước khi công bố.",
  NO_BOARDS_CALCULATED: "Không bảng nào được tính — thiếu phiếu SUBMITTED hoặc bảng đã công bố (dùng force).",
  ALREADY_PUBLISHED: "Tất cả bảng đã được công bố trước đó.",
  NOTIFICATION_NOT_FOUND: "Không tìm thấy thông báo.",
  NOTIFICATION_FORBIDDEN: "Bạn không có quyền xem thông báo này.",
  EVENT_NOT_FOUND: "Không tìm thấy cuộc thi."
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
