import { getApiErrorMessage } from "./apiError";

const organizerErrorMap: Record<string, string> = {
  DATA_INTEGRITY_VIOLATION:
    "Không thể gỡ vì còn dữ liệu liên quan (ví dụ phiếu chấm). Hệ thống sẽ tự xóa phiếu nháp khi gỡ giám khảo.",
  ONLY_ORGANIZER: "Tài khoản chưa có quyền ban tổ chức. Liên hệ quản trị để được cấp quyền.",
  "Organizer role required": "Tài khoản chưa có quyền ban tổ chức. Liên hệ quản trị để được cấp quyền.",
  TARGET_NOT_MENTOR: "Người được chọn chưa có vai trò mentor.",
  TARGET_NOT_JUDGE: "Người được chọn chưa có vai trò giám khảo.",
  SLOT_OCCUPIED: "Vị trí đã có đội — bật «Ghi đè» hoặc gỡ đội trước.",
  TEAM_NOT_CONFIRMED: "Chỉ gán đội ở trạng thái đã xác nhận.",
  TEAM_ALREADY_ASSIGNED: "Đội đã được gán vào một vị trí khác trong vòng này.",
  TEAM_EVENT_MISMATCH: "Đội không thuộc cuộc thi của vòng đang chọn.",
  ROUND_NOT_PLANNED:
    "Vòng đã vào giai đoạn chấm điểm hoặc đã kết thúc — không thể phân công ngẫu nhiên.",
  FROM_SLOT_EMPTY: "Vị trí nguồn đang trống.",
  TO_SLOT_OCCUPIED: "Vị trí đích đã có đội.",
  SLOT_EMPTY: "Vị trí đang trống, không cần gỡ.",
  SLOT_HAS_TEAM: "Chỉ xóa được vị trí trống — gỡ đội trước.",
  "startAt must be before endAt": "Thời gian kết thúc vòng phải sau thời gian bắt đầu.",
  "closeAt must be after releaseAt": "Thời gian đóng đề phải sau thời gian mở đề.",
  "name must be between 3 and 200 characters": "Tên cuộc thi cần từ 3 đến 200 ký tự.",
  "title must be between 1 and 255 characters": "Tên đề thi tối đa 255 ký tự.",
  "externalLink must start with http:// or https://":
    "URL phải bắt đầu bằng http:// hoặc https://.",
  "subject must not exceed 255 characters": "Tiêu đề email tối đa 255 ký tự.",
  "bodyHtml must not exceed 50000 characters": "Nội dung email quá dài.",
  "label must not be blank": "Nhãn mức điểm không được trống.",
  "comment must not exceed 2000 characters": "Ghi chú tối đa 2.000 ký tự.",
  "generalFeedback must not exceed 2000 characters": "Nhận xét chung tối đa 2.000 ký tự.",
  "code must not exceed 50 characters": "Mã học kỳ tối đa 50 ký tự.",
  "name must not exceed 200 characters": "Tên tối đa 200 ký tự.",
  "startDate must be before endDate": "Ngày kết thúc phải sau ngày bắt đầu.",
  "startDate must be before or equal to endDate": "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.",
  "registrationStartAt must be before or equal to registrationEndAt":
    "Thời gian đóng đăng ký phải sau hoặc bằng thời gian mở đăng ký.",
  "registrationEndAt must be on or before event endDate":
    "Thời gian đóng đăng ký phải trước hoặc trong ngày kết thúc cuộc thi.",
  "registrationStartAt should be on or before event startDate":
    "Thời gian mở đăng ký nên trước hoặc bằng ngày bắt đầu cuộc thi.",
  "round startAt must be on or after event startDate":
    "Thời gian bắt đầu vòng phải từ ngày bắt đầu cuộc thi.",
  "round endAt must be on or before event endDate":
    "Thời gian kết thúc vòng phải trước hoặc trong ngày kết thúc cuộc thi.",
  "event dates must be within academic term startDate and endDate":
    "Ngày cuộc thi phải nằm trong khoảng học kỳ đã chọn.",
  "round timeline overlaps with round":
    "Thời gian vòng chồng lấn với vòng khác trong cùng cuộc thi.",
  "fromRoundId and toRoundId must differ": "Vòng nguồn và vòng đích phải khác nhau.",
  TEAM_NOT_ELIGIBLE: "Đội không đủ điều kiện chuyển vòng (chưa có trong BXH đã công bố).",
  NO_PUBLISHED_RANKINGS_TO_ADVANCE: "Chưa có BXH đã công bố để chuyển đội.",
  "slotAId and slotBId must differ": "Hai vị trí hoán đổi phải khác nhau.",
  "fromSlotId and toSlotId must differ": "Vị trí nguồn và đích phải khác nhau.",
  "content must not exceed 10000 characters": "Nội dung tối đa 10.000 ký tự.",
  "description must not exceed 10000 characters": "Mô tả đề thi tối đa 10.000 ký tự.",
  "description must not exceed 500 characters": "Mô tả tối đa 500 ký tự.",
  "releaseAt must be on or after round startAt":
    "Thời gian mở đề phải từ thời gian bắt đầu vòng.",
  "closeAt must be on or before round endAt":
    "Thời gian đóng đề phải trước hoặc bằng thời gian kết thúc vòng.",
  "registrationStartAt must not be null": "Thời gian mở đăng ký là bắt buộc.",
  "registrationEndAt must not be null": "Thời gian đóng đăng ký là bắt buộc.",
  "startDate must not be null": "Ngày bắt đầu là bắt buộc.",
  "endDate must not be null": "Ngày kết thúc là bắt buộc.",
  "releaseAt must not be null": "Thời gian mở đề là bắt buộc.",
  "repositoryName must not exceed 255 characters": "Tên repository tối đa 255 ký tự.",
  "repositoryUrl must not exceed 2048 characters": "Link repository quá dài.",
  "teamName must be between 3 and 100 characters": "Tên đội cần từ 3 đến 100 ký tự.",
  "studentId must not exceed 100 characters": "MSSV tối đa 100 ký tự.",
  "university must not exceed 200 characters": "Tên trường tối đa 200 ký tự.",
  "fullName must not exceed 200 characters": "Họ tên tối đa 200 ký tự.",
  "Registration end date has passed": "Đã qua hạn đóng đăng ký — cập nhật ngày đăng ký trước.",
  "teamId must not be null": "Chọn đội để gán vào vị trí.",
  "userId must not be null": "Chọn người để phân công.",
  "fromSlotId must not be null": "Chọn vị trí nguồn.",
  "toSlotId must not be null": "Chọn vị trí đích.",
  RUBRIC_LOCKED: "Tiêu chí chấm đã khóa — có phiếu chấm đã nộp, không thể sửa.",
  RUBRIC_NOT_CONFIGURED: "Chưa cấu hình tiêu chí chấm cho vòng này.",
  INVALID_WEIGHT_SUM: "Tổng trọng số phải bằng 100%.",
  DUPLICATE_CRITERIA: "Mã hoặc tên tiêu chí bị trùng trong vòng.",
  INVALID_LEVEL_DESCRIPTORS: "Mỗi tiêu chí cần đúng 4 mức mô tả.",
  SCORE_OUT_OF_RANGE: "Điểm nằm ngoài thang cho phép.",
  INCOMPLETE_SCORE_SHEET: "Chưa nhập đủ điểm cho mọi tiêu chí.",
  JUDGE_NOT_ASSIGNED: "Giám khảo chưa được phân công cho bảng này.",
  ONLY_JUDGE: "Tài khoản chưa có quyền giám khảo.",
  ALREADY_SUBMITTED: "Không thể nộp phiếu — vui lòng thử lại.",
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
  RANKING_PUBLISHED: "Bảng đã công bố — dùng «Tính lại» để tính lại.",
  RANKING_NOT_CALCULATED: "Chưa tính xếp hạng — tính xếp hạng trước khi công bố.",
  NO_BOARDS_CALCULATED:
    "Không bảng nào được tính — thiếu phiếu chấm đã nộp hoặc bảng đã công bố (dùng tính lại).",
  ALREADY_PUBLISHED: "Tất cả bảng đã được công bố trước đó.",
  NOTIFICATION_NOT_FOUND: "Không tìm thấy thông báo.",
  NOTIFICATION_FORBIDDEN: "Bạn không có quyền xem thông báo này.",
  EVENT_NOT_FOUND: "Không tìm thấy cuộc thi.",
  CONCURRENT_MODIFICATION: "Dữ liệu vừa được cập nhật bởi người khác — tải lại và thử lại.",
  TEAM_WAITLIST: "Đội đang trong danh sách chờ.",
  TEAM_REJECTED: "Hồ sơ đội đã bị từ chối.",
  PUBLISH_NOT_READY: "Chưa đủ điều kiện công bố — hoàn tất tiêu chí chấm, phân công GK và chấm điểm trước.",
  "Chưa phân công giám khảo.": "Chưa phân công giám khảo cho bảng này.",
  "Chưa gán đội vào slot.": "Chưa gán đội vào bảng thi.",
  "Chấm điểm chưa hoàn tất": "Chấm điểm chưa hoàn tất — còn phiếu chưa nộp.",
  "templateOwner is invalid": "GitHub owner không hợp lệ.",
  "templateRepo is invalid": "Tên repository không hợp lệ.",
  "templateOwner must not exceed 39 characters": "GitHub owner tối đa 39 ký tự.",
  "templateRepo must not exceed 100 characters": "Tên repository tối đa 100 ký tự.",
  "defaultBranch must not exceed 100 characters": "Tên nhánh tối đa 100 ký tự.",
  USERNAME_INVALID: "Tên GitHub không hợp lệ (3–39 ký tự, chữ/số và dấu gạch ngang).",
  "avatarUrl must not exceed 2048 characters": "URL ảnh đại diện quá dài.",
  "year must be at least 2000": "Năm học kỳ phải từ 2000 trở lên.",
  "year must be at most 2100": "Năm học kỳ không được sau 2100.",
  "Role must be MENTOR or JUDGE": "Vai trò mời chỉ được Mentor hoặc Giám khảo.",
  "weight must be greater than 0": "Trọng số phải lớn hơn 0.",
  "weight must be at most 100": "Trọng số tối đa 100%.",
  "attachmentUrl must not exceed 2048 characters": "Link đính kèm quá dài.",
  "reason must not exceed 1000 characters": "Lý do tối đa 1.000 ký tự.",
  "teamId must be greater than 0": "Chọn đội hợp lệ để gán vào vị trí.",
  "userId must be greater than 0": "Chọn người hợp lệ để phân công.",
  "minTeamSize and maxTeamSize are managed by the system":
    "Quy mô đội do hệ thống quản lý — không gửi minTeamSize/maxTeamSize.",
  "boardId and createdBy cannot be updated": "Không thể đổi bảng hoặc người tạo đề qua API cập nhật.",
  "Role must be ORGANIZER, MENTOR, or JUDGE": "Chỉ gán vai trò BTC, Mentor hoặc Giám khảo.",
  "INVALID_SCORE_RANGE": "Điểm tối đa phải lớn hơn điểm tối thiểu.",
  "level must be EXCELLENT, GOOD, SATISFACTORY, or UNSATISFACTORY":
    "Mức mô tả không hợp lệ.",
  "items must not exceed 100 entries": "Tối đa 100 lời mời nhân sự trong một lần.",
  "eventId must be greater than 0": "Chọn cuộc thi hợp lệ.",
  ACADEMIC_TERM_ACTIVE_EXISTS:
    "Đã có học kỳ đang hoạt động. Lưu trữ kỳ hiện tại trước khi tạo hoặc kích hoạt kỳ mới.",
  ACADEMIC_TERM_CODE_EXISTS: "Mã học kỳ đã tồn tại.",
  ACADEMIC_TERM_YEAR_TYPE_EXISTS: "Đã có học kỳ cùng loại và năm.",
  ACADEMIC_TERM_ARCHIVED: "Học kỳ đã lưu trữ — không thể dùng cho thao tác mới.",
  ACADEMIC_TERM_NOT_FOUND: "Không tìm thấy học kỳ."
};

/** Alias của `resolveApiError` — giữ tương thích import cũ. */
export function resolveOrganizerApiError(error: unknown, fallback: string) {
  return mapOrganizerErrorMessage(getApiErrorMessage(error, fallback));
}


export function mapOrganizerErrorMessage(message: string) {
  const trimmed = message.trim();
  if (organizerErrorMap[trimmed]) return organizerErrorMap[trimmed];

  const lower = trimmed.toLowerCase();
  if (lower.includes("forbidden") || lower.includes("organizer role required")) {
    return organizerErrorMap.ONLY_ORGANIZER;
  }
  for (const [key, vi] of Object.entries(organizerErrorMap)) {
    if (trimmed.includes(key)) return vi;
  }
  if (/^[A-Z][A-Z0-9_]+$/.test(trimmed)) {
    return "Không thực hiện được thao tác. Vui lòng thử lại hoặc liên hệ ban tổ chức.";
  }
  return trimmed;
}
