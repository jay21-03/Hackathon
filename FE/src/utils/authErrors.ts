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
    "Không xác thực được Google. Kiểm tra Authorized JavaScript origins trong Google Cloud Console."
};

export function mapAuthErrorMessage(message: string) {
  const trimmed = message.trim();
  for (const [key, vi] of Object.entries(authErrorMap)) {
    if (trimmed.includes(key)) return vi;
  }
  return trimmed;
}
