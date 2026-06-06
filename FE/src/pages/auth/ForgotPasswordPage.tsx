import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AuthAlert,
  AuthFieldLabel,
  AuthFormShell,
  authInputClassName
} from "../../components/auth/AuthFormShell";
import { Button } from "../../components/ui/Button";
import { requestPasswordReset } from "../../services/authService";
import { mapAuthErrorMessage } from "../../utils/authErrors";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setDevResetUrl(result.devResetUrl ?? null);
      setSent(true);
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err.message : "Gửi email thất bại."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFormShell
      title="Quên mật khẩu"
      subtitle="Nhập email đã đăng ký — chúng tôi sẽ gửi liên kết đặt lại mật khẩu."
      footer={
        <>
          Nhớ mật khẩu?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      {sent ? (
        <AuthAlert tone="warning">
          {devResetUrl ? (
            <>
              Mail dev đang tắt — dùng liên kết đặt lại mật khẩu:{" "}
              <a href={devResetUrl} className="break-all text-primary hover:underline">
                {devResetUrl}
              </a>
            </>
          ) : (
            <>
              Nếu email đã đăng ký, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Kiểm tra hộp thư (và thư
              rác).
            </>
          )}
        </AuthAlert>
      ) : null}
      {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}

      {!sent ? (
        <form className="flex flex-col gap-md" onSubmit={(e) => void handleSubmit(e)}>
          <AuthFieldLabel label="Email" required>
            <input
              type="email"
              className={authInputClassName()}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              autoComplete="email"
              disabled={loading}
              required
            />
          </AuthFieldLabel>
          <Button type="submit" loading={loading} className="w-full justify-center">
            Gửi liên kết đặt lại
          </Button>
        </form>
      ) : (
        <Link to="/login" className="text-center font-body-sm text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      )}
    </AuthFormShell>
  );
}
