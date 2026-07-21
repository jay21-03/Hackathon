import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { z } from "zod";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import {
  AuthAlert,
  AuthDivider,
  AuthFieldLabel,
  AuthFormShell,
  authInputClassName
} from "../../components/auth/AuthFormShell";
import {
  StudentTypeFields,
  type StudentTypeValue
} from "../../components/auth/StudentTypeFields";
import { StaffProfileFields } from "../../components/auth/StaffProfileFields";
import { Button } from "../../components/ui/Button";
import { signupSchema, mentorJudgeSignupSchema } from "../../domain/schemas";
import { googleLogin, registerAccount } from "../../services/authService";
import { applyAuthFormErrors, mapAuthErrorMessage } from "../../utils/authErrors";
import { finishAuthSession } from "../../utils/authFinish";
import { zodFieldErrors } from "../../utils/zodFieldErrors";
import { isStaffInvitationActionPath } from "../../utils/staffInvitationPaths";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export function SignupPage() {
  const location = useLocation();
  const authReturnTo =
    (location.state as { from?: string } | null)?.from?.trim() ||
    new URLSearchParams(location.search).get("from")?.trim() ||
    undefined;
  const staffSignupFlow = isStaffInvitationActionPath(authReturnTo);

  const [studentType, setStudentType] = useState<StudentTypeValue>("FPT");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [university, setUniversity] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleGoogleSignup(idToken: string) {
    setAuthError(null);
    setLoading(true);
    try {
      const result = await googleLogin(idToken);
      await finishAuthSession(result, authReturnTo ? { from: authReturnTo } : undefined);
    } catch (error) {
      setAuthError(mapAuthErrorMessage(error instanceof Error ? error.message : "Đăng ký thất bại."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    setAuthError(null);
    const parsed = staffSignupFlow
      ? mentorJudgeSignupSchema.safeParse({
          fullName,
          githubUsername,
          email,
          password,
          confirmPassword
        })
      : signupSchema.safeParse({
          studentType,
          fullName,
          studentId,
          university: university || undefined,
          githubUsername,
          email,
          password,
          confirmPassword
        });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      if (staffSignupFlow) {
        const staffPayload = parsed.data as z.infer<typeof mentorJudgeSignupSchema>;
        const {
          email: staffEmail,
          password: staffPassword,
          fullName: staffFullName,
          githubUsername: staffGithub
        } = staffPayload;
        const result = await registerAccount({
          email: staffEmail,
          password: staffPassword,
          fullName: staffFullName,
          githubUsername: staffGithub
        });
        await finishAuthSession(result, authReturnTo ? { from: authReturnTo } : undefined);
        return;
      }

      const participantPayload = parsed.data as z.infer<typeof signupSchema>;
      const result = await registerAccount({
        studentType: participantPayload.studentType,
        fullName: participantPayload.fullName,
        studentId: participantPayload.studentId,
        githubUsername: participantPayload.githubUsername,
        email: participantPayload.email,
        password: participantPayload.password,
        university: participantPayload.university || undefined
      });
      await finishAuthSession(result, authReturnTo ? { from: authReturnTo } : undefined);
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
      subtitle={
        staffSignupFlow
          ? "Tạo tài khoản mentor/giám khảo — họ tên, GitHub username và email."
          : "Tạo tài khoản bằng Google hoặc email."
      }
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
        {staffSignupFlow ? (
          <StaffProfileFields
            fullName={fullName}
            onFullNameChange={setFullName}
            githubUsername={githubUsername}
            onGithubUsernameChange={setGithubUsername}
            requireGithub
            fieldErrors={fieldErrors}
            onClearError={(key) => setFieldErrors((prev) => ({ ...prev, [key]: "" }))}
            disabled={loading}
          />
        ) : (
          <StudentTypeFields
            studentType={studentType}
            onStudentTypeChange={setStudentType}
            fullName={fullName}
            onFullNameChange={setFullName}
            studentId={studentId}
            onStudentIdChange={setStudentId}
            university={university}
            onUniversityChange={setUniversity}
            githubUsername={githubUsername}
            onGithubUsernameChange={setGithubUsername}
            fieldErrors={fieldErrors}
            onClearError={(key) => setFieldErrors((prev) => ({ ...prev, [key]: "" }))}
            disabled={loading}
          />
        )}

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

        <AuthFieldLabel label="Xác nhận mật khẩu" required>
          <input
            type="password"
            className={authInputClassName(fieldErrors.confirmPassword ? "border-error" : "")}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            disabled={loading}
          />
          {fieldErrors.confirmPassword ? (
            <span className="font-body-sm text-error">{fieldErrors.confirmPassword}</span>
          ) : null}
        </AuthFieldLabel>

        <Button type="submit" loading={loading} className="w-full justify-center">
          Tạo tài khoản
        </Button>
      </form>

      <p className="font-body-sm text-on-surface-variant">
        {authReturnTo && isStaffInvitationActionPath(authReturnTo)
          ? "Sau khi tạo tài khoản, bạn sẽ được đưa về trang xác nhận lời mời mentor/giám khảo — không cần chờ ban tổ chức duyệt thí sinh."
          : "Sau đăng ký, ban tổ chức sẽ duyệt tài khoản trước khi bạn tham gia cuộc thi."}
      </p>
    </AuthFormShell>
  );
}
