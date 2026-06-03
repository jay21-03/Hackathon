import { Link } from "react-router-dom";
import { getDemoSession, getRoleHome } from "../../auth/demoSession";
import { RoleSwitcher } from "../../components/auth/RoleSwitcher";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginPage() {
  return (
    <main className="relative z-10 w-full max-w-md px-margin-mobile">
      <div className="bg-surface-container border border-outline-variant rounded-xl ambient-glow overflow-hidden">
        <div className="p-xl border-b border-outline-variant/50 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center border border-outline-variant mb-lg">
            <Icon name="shield_person" filled className="text-primary text-3xl" />
          </div>
          <h1 className="font-headline-md text-primary mb-sm">SEAL Hackathon</h1>
          <p className="font-body-md text-on-surface-variant max-w-[280px]">
            Quan ly dang ky, cham diem va cong bo ket qua hackathon trong mot noi.
          </p>
        </div>

        <div className="p-xl flex flex-col gap-lg">
          <Button variant="google" className="w-full" icon={<GoogleIcon />}>
            Continue with Google
          </Button>

          <div className="flex items-center gap-md">
            <div className="h-px bg-outline-variant flex-1" />
            <span className="font-label-sm text-outline">Dang nhap he thong</span>
            <div className="h-px bg-outline-variant flex-1" />
          </div>

          <form
            className="flex flex-col gap-md"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = getRoleHome(getDemoSession().role);
            }}
          >
            <RoleSwitcher compact />
            <div className="flex flex-col gap-xs">
              <label htmlFor="email" className="font-label-sm text-on-surface-variant normal-case">
                Email dang nhap
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@hackathon.org"
                className="w-full bg-surface border border-outline-variant rounded px-md py-2.5 font-mono-data text-on-surface placeholder:text-outline focus:outline-none focus:border-b-2 focus:border-b-primary"
              />
            </div>
            <Button variant="secondary" className="w-full mt-sm" type="submit">
              Tiep tuc
              <Icon name="arrow_forward" className="text-sm" />
            </Button>
          </form>
        </div>

        <div className="p-md bg-surface-container-high border-t border-outline-variant flex justify-center gap-lg">
          <a href="#" className="font-label-sm text-on-surface-variant hover:text-primary normal-case">
            Huong dan
          </a>
          <a href="#" className="font-label-sm text-on-surface-variant hover:text-primary normal-case">
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
