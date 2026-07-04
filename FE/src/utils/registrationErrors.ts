import { getApiFieldErrors } from "./apiError";

const registrationErrorMap: Record<string, string> = {
  "Registration for this event is closed":
    "Cuộc thi chưa mở đăng ký hoặc đã hết hạn đăng ký. Ban tổ chức cần bấm «Mở đăng ký» trước.",
  TEAM_NAME_DUPLICATE: "Tên đội đã tồn tại trong cuộc thi này.",
  MEMBER_EMAIL_DUPLICATE: "Email thành viên đã đăng ký trong cuộc thi này.",
  EMAIL_DUPLICATE: "Email đã được sử dụng.",
  AWARD_CATEGORY_DUPLICATE: "Mã loại giải đã tồn tại trong cuộc thi này.",
  GITHUB_USERNAME_DUPLICATE: "GitHub username đã được sử dụng.",
  DATA_INTEGRITY_VIOLATION: "Dữ liệu trùng hoặc không hợp lệ. Kiểm tra lại thông tin đã nhập.",
  "Team name already exists for this event": "Tên đội đã tồn tại trong cuộc thi này.",
  "User/email already registered in another team for this event":
    "Một email trong danh sách đã thuộc đội khác của cuộc thi này.",
  "Duplicate member email in request": "Trùng email thành viên trong form.",
  "Invalid email format": "Email thành viên không hợp lệ.",
  "Team size must be between": "Số thành viên không đúng quy định của cuộc thi.",
  "Team has reached the maximum size of": "Đội đã đủ số thành viên tối đa.",
  "Email already belongs to this team": "Email này đã có trong đội.",
  "Team registration is closed": "Không thể thay đổi đội ở trạng thái hiện tại.",
  TEAM_ROSTER_LOCKED_AFTER_ASSIGNMENT:
    "Đội đã được phân bảng — bỏ phân bảng trước khi đổi thành viên.",
  TEAM_ROSTER_LOCKED_AFTER_OPERATION:
    "Đội đã có dữ liệu vận hành thi (repo/phiếu chấm/xếp hạng) — không thể đổi thành viên.",
  "Cannot resend confirmed invitation": "Thành viên đã xác nhận, không gửi lại được.",
  "Idempotency key already used for a different request":
    "Yêu cầu trùng khóa. Hãy tải lại trang và thử lại.",
  "Duplicate request in progress": "Đang xử lý yêu cầu trước. Đợi vài giây rồi thử lại.",
  "name must not be blank": "Tên đội không hợp lệ.",
  "Reason is required for this status transition": "Cần nhập lý do khi từ chối hoặc loại đội.",
  "Invalid team status transition": "Không thể chuyển sang trạng thái này.",
  STUDENT_ID_REQUIRED: "MSSV là bắt buộc cho mỗi thành viên.",
  UNIVERSITY_REQUIRED: "Trường là bắt buộc cho mỗi thành viên.",
  SUBMISSION_DEADLINE_PASSED: "Đã qua hạn nộp bài.",
  NOT_RELEASED: "Đề chưa mở — chưa thể nộp bài.",
  PROBLEM_CLOSED: "Đề đã đóng — không thể nộp bài.",
  PROBLEM_UNAVAILABLE: "Chưa thể nộp bài trong thời điểm hiện tại.",
  INVALID_REPOSITORY_URL: "Link phải là GitHub hoặc GitLab hợp lệ (có đường dẫn repository).",
  "reason must not exceed 1000 characters": "Lý do tối đa 1.000 ký tự.",
  "reason is required for REJECTED or DISQUALIFIED status":
    "Cần nhập lý do khi từ chối hoặc loại đội.",
  "minTeamSize and maxTeamSize are managed by the system":
    "Quy mô đội do hệ thống quản lý — không gửi minTeamSize/maxTeamSize.",
  "code must not exceed 50 characters": "Mã tiêu chí tối đa 50 ký tự.",
  "name must not exceed 200 characters": "Tên tối đa 200 ký tự.",
  "members must not exceed 50 items": "Tối đa 50 lời mời trong một lần.",
  ACCOUNT_PENDING_APPROVAL:
    "Tài khoản chưa được ban tổ chức duyệt. Vui lòng chờ phê duyệt trước khi đăng ký đội.",
  "All team members must confirm before organizer approval":
    "Tất cả thành viên phải xác nhận email trước khi BTC duyệt đội."
};

function mapRegistrationFieldKey(key: string): string {
  const memberMatch = key.match(/^members\[(\d+)\]\.(\w+)$/);
  if (memberMatch) {
    return `members.${memberMatch[1]}.${memberMatch[2]}`;
  }
  if (key === "name") return "teamName";
  return key.includes(".") ? key.split(".").pop()! : key;
}

/** Gán fieldErrors từ API đăng ký/đội với message tiếng Việt. */
export function applyRegistrationFormErrors(
  error: unknown,
  setFieldErrors: (errors: Record<string, string>) => void,
  setMemberFieldErrors?: (errors: Record<number, Record<string, string>>) => void
): boolean {
  const raw = getApiFieldErrors(error);
  if (!raw) return false;

  const flat: Record<string, string> = {};
  const members: Record<number, Record<string, string>> = {};

  for (const [key, message] of Object.entries(raw)) {
    const vi = mapRegistrationErrorMessage(message);
    const memberMatch = key.match(/^members\[(\d+)\]\.(\w+)$/);
    if (memberMatch && setMemberFieldErrors) {
      const index = Number(memberMatch[1]);
      const field = memberMatch[2];
      if (!members[index]) members[index] = {};
      members[index][field] = vi;
      continue;
    }
    flat[mapRegistrationFieldKey(key)] = vi;
  }

  setFieldErrors(flat);
  if (setMemberFieldErrors && Object.keys(members).length > 0) {
    setMemberFieldErrors(members);
  }
  return true;
}

export function mapRegistrationErrorMessage(message: string) {
  const trimmed = message.trim();
  for (const [key, vi] of Object.entries(registrationErrorMap)) {
    if (trimmed.includes(key)) return vi;
  }
  return trimmed;
}

export function isRegistrationOpen(status?: string) {
  return (status ?? "").toUpperCase() === "REGISTRATION_OPEN";
}

export function isWithinRegistrationWindow(
  registrationStartAt?: string,
  registrationEndAt?: string,
  now = Date.now()
) {
  if (!registrationStartAt || !registrationEndAt) return true;
  const start = new Date(registrationStartAt).getTime();
  const end = new Date(registrationEndAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return true;
  return now >= start && now <= end;
}

/** BTC đã bấm mở đăng ký (không xét khung giờ). */
export function isRegistrationStatusOpen(status?: string) {
  return isRegistrationOpen(status);
}

/** Có thể gửi form đăng ký ngay (trạng thái + khung thời gian). */
export function canRegisterForEvent(
  status?: string,
  registrationStartAt?: string,
  registrationEndAt?: string
) {
  return (
    isRegistrationStatusOpen(status) &&
    isWithinRegistrationWindow(registrationStartAt, registrationEndAt)
  );
}

export function registrationWindowHint(
  registrationStartAt?: string,
  registrationEndAt?: string,
  now = Date.now()
) {
  if (!registrationStartAt || !registrationEndAt) return null;
  const start = new Date(registrationStartAt).getTime();
  const end = new Date(registrationEndAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (now < start) return "Chưa tới hạn mở đăng ký theo lịch BTC.";
  if (now > end) return "Đã qua hạn đăng ký theo lịch BTC.";
  return null;
}

export function canOpenRegistration(registrationEndAt?: string, now = Date.now()) {
  if (!registrationEndAt) return true;
  const end = new Date(registrationEndAt).getTime();
  if (Number.isNaN(end)) return true;
  return now <= end;
}
