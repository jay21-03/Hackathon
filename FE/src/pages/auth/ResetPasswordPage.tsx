import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AuthAlert,
  AuthFieldLabel,
  AuthFormShell,
  authInputClassName
} from "../../components/auth/AuthFormShell";
import { Button } from "../../components/ui/Button";
import { resetPasswordWithToken } from "../../services/authService";
import { mapAuthErrorMessage } from "../../utils/authErrors";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setError("Liên kết đặt lại mật khẩu không hợp lệ.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPasswordWithToken({ token, newPassword });
      setDone(true);
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại."));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthFormShell title="Đặt lại mật khẩu">
        <AuthAlert tone="error">Liên kết không hợp lệ hoặc đã hết hạn.</AuthAlert>
        <Link to="/login/forgot-password" className="text-primary hover:underline font-body-sm">
          Yêu cầu liên kết mới
        </Link>
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell
      title="Đặt lại mật khẩu"
      subtitle="Chọn mật khẩu mới cho tài khoản của bạn."
    >
      {done ? (
        <>
          <AuthAlert tone="warning">
            Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.
          </AuthAlert>
          <Link to="/login" className="text-center font-body-sm text-primary hover:underline">
            Đăng nhập
          </Link>
        </>
      ) : (
        <form className="flex flex-col gap-md" onSubmit={(e) => void handleSubmit(e)}>
          {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}
          <AuthFieldLabel
            label="Mật khẩu mới"
            required
            hint="≥15 ký tự, hoặc ≥8 ký tự gồm số và chữ thường."
          >
            <input
              type="password"
              className={authInputClassName()}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </AuthFieldLabel>
          <AuthFieldLabel label="Xác nhận mật khẩu" required>
            <input
              type="password"
              className={authInputClassName()}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </AuthFieldLabel>
          <Button type="submit" loading={loading} className="w-full justify-center">
            Lưu mật khẩu mới
          </Button>
        </form>
      )}
    </AuthFormShell>
  );
}
