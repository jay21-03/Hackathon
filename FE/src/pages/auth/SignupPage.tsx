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

import { googleLogin, registerAccount } from "../../services/authService";

import { mapAuthErrorMessage } from "../../utils/authErrors";

import { finishAuthSession } from "../../utils/authFinish";



const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();



export function SignupPage() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);



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

    setLoading(true);

    try {

      const result = await registerAccount({

        email: email.trim(),

        password

      });

      await finishAuthSession(result);

    } catch (error) {

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

              setAuthError(

                "Google từ chối origin này — thêm http://localhost:5173 vào Authorized JavaScript origins."

              )

            }

          />

        </div>

      ) : null}



      {googleClientId ? <AuthDivider /> : null}



      <form className="flex flex-col gap-md" onSubmit={(e) => void handleSignup(e)}>

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

        <AuthFieldLabel

          label="Mật khẩu"

          required

          hint="≥15 ký tự, hoặc ≥8 ký tự gồm số và chữ thường."

        >

          <input

            type="password"

            className={authInputClassName()}

            value={password}

            onChange={(e) => setPassword(e.target.value)}

            placeholder="Mật khẩu"

            autoComplete="new-password"

            disabled={loading}

            required

          />

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


