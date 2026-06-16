import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import {
  AuthAlert,
  AuthDivider,
  AuthFieldLabel,
  AuthFormShell,
  authInputClassName
} from "../../components/auth/AuthFormShell";
import { Button } from "../../components/ui/Button";
import { loginSchema } from "../../domain/schemas";
import { googleLogin, loginWithPassword } from "../../services/authService";
import { applyAuthFormErrors, mapAuthErrorMessage } from "../../utils/authErrors";
import { finishAuthSession } from "../../utils/authFinish";
import { zodFieldErrors } from "../../utils/zodFieldErrors";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export function LoginPage() {
  const location = useLocation();
  const message = (location.state as { message?: string } | null)?.message;
  const from = (location.state as { from?: string } | null)?.from;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleGoogleLogin(idToken: string) {
    setAuthError(null);
    setLoading(true);
    try {
      const result = await googleLogin(idToken);
      await finishAuthSession(result, { from });
    } catch (error) {
      setAuthError(mapAuthErrorMessage(error instanceof Error ? error.message : "Đăng nhập thất bại."));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordLogin(event: React.FormEvent) {
    event.preventDefault();
    setAuthError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const result = await loginWithPassword(parsed.data);
      await finishAuthSession(result, { from });
    } catch (error) {
      if (!applyAuthFormErrors(error, setFieldErrors)) {
        setAuthError(mapAuthErrorMessage(error instanceof Error ? error.message : "Đăng nhập thất bại."));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFormShell
      title="Đăng nhập SEAL Hackathon"
      subtitle="Tiếp tục bằng Google hoặc email đã đăng ký."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link
            to="/login/signup"
            state={from ? { from } : undefined}
            className="text-primary hover:underline"
          >
            Tạo tài khoản
          </Link>
        </>
      }
    >
      {message ? <AuthAlert tone="warning">{message}</AuthAlert> : null}
      {authError ? <AuthAlert tone="error">{authError}</AuthAlert> : null}

      {!googleClientId ? (
        <AuthAlert tone="warning">
          Google Sign-In chưa cấu hình. Vẫn có thể đăng nhập bằng email/mật khẩu nếu đã đăng ký.
        </AuthAlert>
      ) : (
        <div className={loading ? "pointer-events-none opacity-60" : ""}>
          <GoogleSignInButton
            disabled={loading}
            onSuccess={(token) => void handleGoogleLogin(token)}
            onError={() =>
              setAuthError("Không đăng nhập được bằng Google. Thử lại hoặc dùng email/mật khẩu.")
            }
          />
        </div>
      )}

      <AuthDivider />

      <form className="flex flex-col gap-md" onSubmit={(e) => void handlePasswordLogin(e)}>
        <AuthFieldLabel label="Email" required>
          <input
            type="email"
            className={authInputClassName(fieldErrors.email ? "border-error" : "")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((prev) => ({ ...prev, email: "" }));
            }}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
          />
          {fieldErrors.email ? (
            <span className="font-body-sm text-error">{fieldErrors.email}</span>
          ) : null}
        </AuthFieldLabel>
        <AuthFieldLabel label="Mật khẩu" required>
          <input
            type="password"
            className={authInputClassName(fieldErrors.password ? "border-error" : "")}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder="Mật khẩu"
            autoComplete="current-password"
            disabled={loading}
          />
          {fieldErrors.password ? (
            <span className="font-body-sm text-error">{fieldErrors.password}</span>
          ) : null}
        </AuthFieldLabel>
        <p className="text-right font-body-sm">
          <Link to="/login/forgot-password" className="text-primary hover:underline">
            Quên mật khẩu?
          </Link>
        </p>
        <Button type="submit" loading={loading} className="w-full justify-center">
          Đăng nhập
        </Button>
      </form>
    </AuthFormShell>
  );
}
