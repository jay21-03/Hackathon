import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import {
  getRoleHome,
  resolveRoleFromApiRoles,
  setDemoAuthenticated,
  setDemoSessionFromUser,
  type UserRole
} from "../../auth/demoSession";
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

      setDemoSessionFromUser({
        role,
        email: me.email,
        name: me.fullName
      });
      setDemoAuthenticated(true);

      window.location.href = from ?? getRoleHome(role);
    } catch (error) {
      setDemoAuthenticated(false);
      const apiMessage = error instanceof Error ? error.message : null;

      if (apiMessage === "Email domain is not allowed") {
        setAuthError(
          "Email Google cua ban khong thuoc domain duoc phep (fpt.edu.vn, fe.edu.vn, gmail.com)."
        );
        return;
      }

      if (apiMessage === "Invalid Google ID token") {
        setAuthError("Khong xac thuc duoc tai khoan Google. Vui long thu lai hoac lien he quan tri he thong.");
        return;
      }

      setAuthError(
        apiMessage || "Dang nhap that bai. Vui long thu lai sau."
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
            Dang nhap bang tai khoan Google de su dung he thong.
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
                He thong chua san sang cho dang nhap. Vui long lien he quan tri vien.
              </p>
            </div>
          ) : null}

          <div className={loading ? "pointer-events-none opacity-60" : ""}>
            <GoogleSignInButton
              disabled={!googleClientId || loading}
              onSuccess={handleBackendLogin}
              onError={() => {
                setAuthError("Khong the dang nhap bang Google. Vui long thu lai.");
              }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-lg border-t border-outline-variant bg-surface-container-high p-md">
          <a
            href="#"
            className="font-label-sm normal-case text-on-surface-variant hover:text-primary"
          >
            Huong dan
          </a>
          <a
            href="#"
            className="font-label-sm normal-case text-on-surface-variant hover:text-primary"
          >
            Ho tro
          </a>
        </div>
      </div>

      <div className="mt-lg flex items-center justify-center gap-xs text-center font-label-sm normal-case text-outline">
        <Icon name="lock" className="text-[14px]" />
        <span>Dang nhap an toan qua Google</span>
      </div>

      <p className="mt-md text-center font-body-sm text-on-surface-variant">
        <Link to="/events" className="text-primary hover:underline">
          Xem danh sach cuoc thi
        </Link>
      </p>
    </main>
  );
}
