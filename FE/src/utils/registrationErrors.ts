const registrationErrorMap: Record<string, string> = {
  "Registration for this event is closed":
    "Cuộc thi chưa mở đăng ký hoặc đã hết hạn đăng ký. Ban tổ chức cần bấm «Mở đăng ký» trước.",
  "Team name already exists for this event": "Tên đội đã tồn tại trong cuộc thi này.",
  "User/email already registered in another team for this event":
    "Một email trong danh sách đã thuộc đội khác của cuộc thi này.",
  "Duplicate member email in request": "Trùng email thành viên trong form.",
  "Invalid email format": "Email thành viên không hợp lệ.",
  "Team size must be between": "Số thành viên không đúng quy định của cuộc thi.",
  "Team has reached the maximum size of": "Đội đã đủ số thành viên tối đa.",
  "Email already belongs to this team": "Email này đã có trong đội.",
  "Team registration is closed": "Không thể thay đổi đội ở trạng thái hiện tại.",
  "Cannot resend confirmed invitation": "Thành viên đã xác nhận, không gửi lại được.",
  "Idempotency key already used for a different request":
    "Yêu cầu trùng khóa. Hãy tải lại trang và thử lại.",
  "Duplicate request in progress": "Đang xử lý yêu cầu trước. Đợi vài giây rồi thử lại.",
  "name must not be blank": "Tên đội không hợp lệ.",
  "Reason is required for this status transition": "Cần nhập lý do khi từ chối hoặc loại đội.",
  "Invalid team status transition": "Không thể chuyển sang trạng thái này."
};

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
