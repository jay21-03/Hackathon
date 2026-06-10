import { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import {
  AuthAlert,
  AuthDivider,
  AuthFieldLabel,
  AuthFormShell,
  authInputClassName
} from "../../components/auth/AuthFormShell";
import { Button } from "../../components/ui/Button";
import { signupSchema } from "../../domain/schemas";
import { googleLogin, registerAccount } from "../../services/authService";
import { applyAuthFormErrors, mapAuthErrorMessage } from "../../utils/authErrors";
import { finishAuthSession } from "../../utils/authFinish";
import { zodFieldErrors } from "../../utils/zodFieldErrors";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleGoogleSignup(idToken: string) {
    setAuthError(null);
    setLoading(true);
    try {
      const result = await googleLogin(idToken);
      await finishAuthSession(result);
    } catch (error) {
      setAuthError(mapAuthErrorMessage(error instanceof Error ? error.message : "Đăng ký thất bại."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    setAuthError(null);
    const parsed = signupSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const result = await registerAccount(parsed.data);
      await finishAuthSession(result);
    } catch (error) {
      applyAuthFormErrors(error, setFieldErrors);
      setAuthError(mapAuthErrorMessage(error instanceof Error ? error.message : "Đăng ký thất bại."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFormShell
      title="Đăng ký SEAL Hackathon"
      subtitle="Tạo tài khoản bằng Google hoặc email."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      {authError ? <AuthAlert tone="error">{authError}</AuthAlert> : null}

      {googleClientId ? (
        <div className={loading ? "pointer-events-none opacity-60" : ""}>
          <GoogleSignInButton
            disabled={loading}
            onSuccess={(token) => void handleGoogleSignup(token)}
            onError={() =>
              setAuthError("Không đăng ký được bằng Google. Thử lại hoặc dùng email/mật khẩu.")
            }
          />
        </div>
      ) : null}

      {googleClientId ? <AuthDivider /> : null}

      <form className="flex flex-col gap-md" onSubmit={(e) => void handleSignup(e)}>
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
        <AuthFieldLabel
          label="Mật khẩu"
          required
          hint="≥15 ký tự, hoặc ≥8 ký tự gồm số và chữ thường."
        >
          <input
            type="password"
            className={authInputClassName(fieldErrors.password ? "border-error" : "")}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder="Mật khẩu"
            autoComplete="new-password"
            disabled={loading}
          />
          {fieldErrors.password ? (
            <span className="font-body-sm text-error">{fieldErrors.password}</span>
          ) : null}
        </AuthFieldLabel>
        <Button type="submit" loading={loading} className="w-full justify-center">
          Tạo tài khoản
        </Button>
      </form>

      <p className="font-body-sm text-on-surface-variant">
        Bằng việc tạo tài khoản, bạn đồng ý sử dụng hệ thống theo quy định của ban tổ chức cuộc thi.
      </p>
    </AuthFormShell>
  );
}
