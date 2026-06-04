import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import {
  getRoleHome,
  resolveRoleFromApiRoles,
  setAuthenticated,
  setAuthSession,
  type UserRole
} from "../../auth/authSession";
import { setAccessToken } from "../../auth/tokenStorage";
import { Icon } from "../../components/ui/Icon";
import { googleLogin } from "../../services/authService";
import { fetchCurrentUser } from "../../services/userService";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export function LoginPage() {
  const location = useLocation();
  const message = (location.state as { message?: string } | null)?.message;
  const from = (location.state as { from?: string } | null)?.from;
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  async function handleBackendLogin(idToken: string) {
    setAuthError(null);
    setLoading(true);

    try {
      const result = await googleLogin(idToken);
      setAccessToken(result.accessToken);

      const me = await fetchCurrentUser();
      const role: UserRole = resolveRoleFromApiRoles(me.roles);

      setAuthSession({
        role,
        email: me.email,
        name: me.fullName
      });
      setAuthenticated(true);

      window.location.href = from ?? getRoleHome(role);
    } catch (error) {
      setAuthenticated(false);
      const apiMessage = error instanceof Error ? error.message : null;

      if (apiMessage === "Email domain is not allowed") {
        setAuthError(
          "Email Google của bạn không thuộc domain được phép (fpt.edu.vn, fe.edu.vn, gmail.com)."
        );
        return;
      }

      if (apiMessage === "Invalid Google ID token") {
        setAuthError("Không xác thực được tài khoản Google. Vui lòng thử lại hoặc liên hệ quản trị hệ thống.");
        return;
      }

      setAuthError(
        apiMessage || "Đăng nhập thất bại. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative z-10 w-full max-w-md px-page">
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col items-center border-b border-outline-variant bg-surface-container-low p-xl text-center">
          <div className="mb-lg flex h-12 w-12 items-center justify-center rounded-lg border border-outline-variant bg-surface">
            <Icon name="shield_person" filled className="text-primary text-3xl" />
          </div>

          <h1 className="mb-sm font-headline-md text-on-surface">SEAL Hackathon</h1>

          <p className="font-body-md text-on-surface-variant max-w-[280px]">
            Đăng nhập bằng tài khoản Google để sử dụng hệ thống.
          </p>
        </div>

        <div className="flex flex-col gap-lg p-xl">
          {message ? (
            <div className="rounded-lg border border-warning/40 bg-warning-container/60 px-md py-sm text-on-surface">
              <p className="font-body-sm">{message}</p>
            </div>
          ) : null}

          {authError ? (
            <div className="rounded-lg border border-error/40 bg-error-container/40 px-md py-sm text-on-surface">
              <p className="font-body-sm">{authError}</p>
            </div>
          ) : null}

          {!googleClientId ? (
            <div className="rounded-lg border border-warning/40 bg-warning-container/60 px-md py-sm text-on-surface">
              <p className="font-body-sm">
                Hệ thống chưa sẵn sàng cho đăng nhập. Vui lòng liên hệ quản trị viên.
              </p>
            </div>
          ) : null}

          <div className={loading ? "pointer-events-none opacity-60" : ""}>
            <GoogleSignInButton
              disabled={!googleClientId || loading}
              onSuccess={handleBackendLogin}
              onError={() => {
                setAuthError("Không thể đăng nhập bằng Google. Vui lòng thử lại.");
              }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-lg border-t border-outline-variant bg-surface-container-high p-md">
          <Link
            to="/events"
            className="font-label-sm normal-case text-on-surface-variant hover:text-primary"
          >
            Hướng dẫn
          </Link>
          <a
            href="mailto:support@seal.edu.vn"
            className="font-label-sm normal-case text-on-surface-variant hover:text-primary"
          >
            Hỗ trợ
          </a>
        </div>
      </div>

      <div className="mt-lg flex items-center justify-center gap-xs text-center font-label-sm normal-case text-outline">
        <Icon name="lock" className="text-[14px]" />
        <span>Đăng nhập an toàn qua Google</span>
      </div>

      <p className="mt-md text-center font-body-sm text-on-surface-variant">
        <Link to="/events" className="text-primary hover:underline">
          Xem danh sách cuộc thi
        </Link>
      </p>
    </main>
  );
}
