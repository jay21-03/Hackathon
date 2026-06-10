import { getApiFieldErrors } from "./apiError";

const authErrorMap: Record<string, string> = {
  "Email domain is not allowed":
    "Email không thuộc domain được phép (fpt.edu.vn, fe.edu.vn, gmail.com, seal.edu.vn).",
  EMAIL_ALREADY_EXISTS: "Email đã được đăng ký — thử đăng nhập hoặc dùng Google.",
  PASSWORD_WEAK:
    "Mật khẩu cần ≥15 ký tự, hoặc ≥8 ký tự gồm số và chữ thường.",
  PASSWORD_REQUIRED: "Nhập mật khẩu.",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
  PASSWORD_NOT_SET: "Tài khoản này đăng nhập bằng Google — dùng Google hoặc đặt mật khẩu trong Hồ sơ.",
  INVALID_CURRENT_PASSWORD: "Mật khẩu hiện tại không đúng.",
  INVALID_RESET_TOKEN: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.",
  RESET_TOKEN_EXPIRED: "Liên kết đặt lại mật khẩu đã hết hạn — yêu cầu liên kết mới.",
  "GOOGLE_CLIENT_ID is not configured":
    "Đăng nhập Google chưa sẵn sàng. Liên hệ quản trị hệ thống.",
  "Invalid Google ID token":
    "Không xác thực được phiên Google. Vui lòng thử đăng nhập lại.",
  "Google account is already linked to another user":
    "Email Google này đã gắn tài khoản khác. Đăng nhập bằng email/mật khẩu hoặc liên hệ quản trị.",
  GOOGLE_ACCOUNT_LINK_CONFLICT:
    "Tài khoản Google không khớp email đã đăng ký. Dùng đúng email hoặc đăng nhập bằng mật khẩu.",
  DATA_INTEGRITY_VIOLATION:
    "Email đã tồn tại trong hệ thống. Thử đăng nhập bằng email/mật khẩu thay vì Google."
};

export function mapAuthErrorMessage(message: string) {
  const trimmed = message.trim();
  for (const [key, vi] of Object.entries(authErrorMap)) {
    if (trimmed.includes(key)) return vi;
  }
  return trimmed;
}

/** Gán fieldErrors từ API auth với message tiếng Việt. */
export function applyAuthFormErrors(
  error: unknown,
  setFieldErrors: (errors: Record<string, string>) => void
): boolean {
  const raw = getApiFieldErrors(error);
  if (!raw) return false;
  const mapped: Record<string, string> = {};
  for (const [key, message] of Object.entries(raw)) {
    const field = key.includes(".") ? key.split(".").pop()! : key;
    mapped[field] = mapAuthErrorMessage(message);
  }
  setFieldErrors(mapped);
  return true;
}
