import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { getRoleHome, setDemoAuthenticated, setDemoRole } from "../../auth/demoSession";
import { setAccessToken } from "../../auth/tokenStorage";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { googleLogin } from "../../services/authService";

export function LoginPage() {
  const location = useLocation();
  const devAuthBypassEnabled =
    import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

  const message = (location.state as { message?: string } | null)?.message;
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  function resolveRole(input: string) {
    const value = input.trim().toLowerCase();

    if (value.includes("organizer") || value.includes("admin")) return "organizer";
    if (value.includes("mentor")) return "mentor";
    if (value.includes("judge")) return "judge";

    return "participant";
  }

  async function handleBackendLogin(idToken: string) {
    setAuthError(null);
    setLoading(true);

    try {
      const result = await googleLogin(idToken);
      const role = resolveRole(result.user?.email ?? "participant");

      setAccessToken(result.accessToken);
      setDemoRole(role);
      setDemoAuthenticated(true);

      window.location.href = from ?? getRoleHome(role);
    } catch {
      setAuthError(
        "Google OAuth chua duoc cau hinh hoac xac thuc that bai. Vui long lien he admin de cau hinh dang nhap Google."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDevBypassLogin() {
    setAuthError(null);
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        setAuthError("Nhap email de test che do dev bypass.");
        return;
      }

      const role = resolveRole(normalizedEmail);

      setDemoRole(role);
      setDemoAuthenticated(true);

      window.location.href = from ?? getRoleHome(role);
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

          <h1 className="mb-sm font-headline-md text-on-surface">
            SEAL Hackathon
          </h1>

          <p className="font-body-md text-on-surface-variant max-w-[280px]">
            Quan ly dang ky, cham diem va cong bo ket qua hackathon trong mot noi.
          </p>
        </div>

        <div className="p-xl flex flex-col gap-lg">
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

          <div className={loading ? "pointer-events-none opacity-60" : ""}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                const idToken = credentialResponse.credential;

                if (!idToken) {
                  setAuthError("Khong lay duoc Google ID Token.");
                  return;
                }

                await handleBackendLogin(idToken);
              }}
              onError={() => {
                setAuthError("Dang nhap Google that bai.");
              }}
              useOneTap={false}
            />
          </div>

          {devAuthBypassEnabled ? (
            <p className="font-body-sm text-on-surface-variant">
              Dang o che do local dev bypass: form ben duoi se vao he thong theo email hien tai de test end-to-end.
            </p>
          ) : null}

          {devAuthBypassEnabled ? (
            <>
              <div className="flex items-center gap-md">
                <div className="h-px bg-outline-variant flex-1" />
                <span className="font-label-sm text-outline">
                  Nhap email test local
                </span>
                <div className="h-px bg-outline-variant flex-1" />
              </div>

              <form
                className="flex flex-col gap-md"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleDevBypassLogin();
                }}
              >
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="email"
                    className="font-label-sm text-on-surface-variant normal-case"
                  >
                    Email chi dung cho dev bypass
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="organizer@seal.edu.vn"
                    className="form-input w-full"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <Button
                  variant="secondary"
                  className="w-full mt-sm"
                  type="submit"
                  disabled={loading}
                >
                  Tiep tuc dev bypass
                  <Icon name="arrow_forward" className="text-sm" />
                </Button>
              </form>
            </>
          ) : null}
        </div>

        <div className="p-md bg-surface-container-high border-t border-outline-variant flex justify-center gap-lg">
          <a
            href="#"
            className="font-label-sm text-on-surface-variant hover:text-primary normal-case"
          >
            Huong dan
          </a>

          <a
            href="#"
            className="font-label-sm text-on-surface-variant hover:text-primary normal-case"
          >
            Ho tro
          </a>
        </div>
      </div>

      <div className="mt-lg text-center flex items-center justify-center gap-xs text-outline font-label-sm normal-case">
        <Icon name="lock" className="text-[14px]" />
        <span>Ket noi an toan</span>
      </div>

      <p className="mt-md text-center font-body-sm text-on-surface-variant">
        <Link to="/events" className="text-primary hover:underline">
          Xem danh sach cuoc thi
        </Link>
      </p>
    </main>
  );
}