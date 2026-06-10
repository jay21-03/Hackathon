import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AuthAlert,
  AuthFieldLabel,
  AuthFormShell,
  authInputClassName
} from "../../components/auth/AuthFormShell";
import { Button } from "../../components/ui/Button";
import { forgotPasswordSchema } from "../../domain/schemas";
import { requestPasswordReset } from "../../services/authService";
import { applyAuthFormErrors, mapAuthErrorMessage } from "../../utils/authErrors";
import { zodFieldErrors } from "../../utils/zodFieldErrors";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await requestPasswordReset(parsed.data.email);
      setSent(true);
    } catch (err) {
      if (!applyAuthFormErrors(err, setFieldErrors)) {
        setError(mapAuthErrorMessage(err instanceof Error ? err.message : "Gửi email thất bại."));
      }
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
          Nếu email đã đăng ký, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Kiểm tra hộp thư (và thư rác).
        </AuthAlert>
      ) : null}
      {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}

      {!sent ? (
        <form className="flex flex-col gap-md" onSubmit={(e) => void handleSubmit(e)}>
          <AuthFieldLabel label="Email" required>
            <input
              type="email"
              className={authInputClassName(fieldErrors.email ? "border-error" : "")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              placeholder="you@gmail.com"
              autoComplete="email"
              disabled={loading}
            />
            {fieldErrors.email ? (
              <span className="font-body-sm text-error">{fieldErrors.email}</span>
            ) : null}
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
