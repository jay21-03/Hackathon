import { useEffect, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { getAuthSession, setAuthSession } from "../../auth/authSession";
import { enableGithubProvisioning } from "../../config/features";
import { passwordPolicySchema, profileUpdateSchema } from "../../domain/schemas";
import { applyApiFormErrors } from "../../utils/apiError";
import { setMyPassword } from "../../services/authService";
import { fetchMyProfile, updateMyProfile } from "../../services/profileService";
import { applyAuthFormErrors, mapAuthErrorMessage } from "../../utils/authErrors";

export function ProfilePage() {
  const { notify } = useToast();
  const role = getAuthSession().role;
  const [studentType, setStudentType] = useState<"FPT" | "EXTERNAL">("FPT");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [studentId, setStudentId] = useState("");
  const [university, setUniversity] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchMyProfile()
      .then((result) => {
        if (!active) return;
        setStudentType(result.studentType === "EXTERNAL" ? "EXTERNAL" : "FPT");
        setFullName(result.fullName ?? "");
        setEmail(result.email ?? "");
        setHasPassword(result.hasPassword === true);
        setStudentId(result.studentId ?? "");
        setUniversity(result.university ?? "");
        setGithubUsername(result.githubUsername ?? "");
      })
      .catch(() => {
        if (active) setFormError("Không tải được hồ sơ từ hệ thống.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function savePassword() {
    const parsed = passwordPolicySchema.safeParse(newPassword);
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? "Mật khẩu không hợp lệ.");
      return;
    }
    if (hasPassword === true && !currentPassword.trim()) {
      setPasswordError("Nhập mật khẩu hiện tại.");
      return;
    }
    setPasswordError("");
    setPasswordSaving(true);
    try {
      const wasChanging = hasPassword === true;
      await setMyPassword({
        currentPassword: wasChanging ? currentPassword : undefined,
        newPassword
      });
      setHasPassword(true);
      setCurrentPassword("");
      setNewPassword("");
      notify(
        wasChanging ? "Đã đổi mật khẩu." : "Đã đặt mật khẩu — có thể đăng nhập bằng email.",
        "success"
      );
    } catch (error) {
      let msg = mapAuthErrorMessage(error instanceof Error ? error.message : "Đặt mật khẩu thất bại.");
      applyAuthFormErrors(error, (errors) => {
        const fieldMsg = errors.newPassword ?? errors.currentPassword;
        if (fieldMsg) msg = fieldMsg;
      });
      setPasswordError(msg);
    } finally {
      setPasswordSaving(false);
    }
  }

  async function saveProfile() {
    const parsed = profileUpdateSchema.safeParse({
      studentType,
      fullName,
      studentId,
      university: university || undefined,
      githubUsername
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const key = first?.path[0];
      if (typeof key === "string") {
        setFieldErrors({ [key]: first.message });
      }
      setFormError(first?.message ?? "Hồ sơ chưa hợp lệ.");
      return;
    }
    setFormError("");
    setFieldErrors({});
    setSaving(true);
    try {
      const result = await updateMyProfile({
        studentType: parsed.data.studentType,
        fullName: parsed.data.fullName,
        studentId: parsed.data.studentId,
        university: parsed.data.university || undefined,
        githubUsername: parsed.data.githubUsername?.trim() || undefined
      });
      setFullName(result.fullName ?? fullName);
      setStudentId(result.studentId ?? studentId);
      setUniversity(result.university ?? university);
      setGithubUsername(result.githubUsername ?? githubUsername);
      const session = getAuthSession();
      setAuthSession({
        ...session,
        name: result.fullName || session.name,
        profileCompleted: result.profileCompleted !== false
      });
      notify("Đã lưu hồ sơ ca nhan.", "success");
    } catch (error) {
      applyApiFormErrors(error, setFieldErrors);
      notify("Lưu hồ sơ thất bại.", "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tài khoản"
        title="Hồ sơ cá nhân"
        description="Cập nhật thông tin liên hệ để ban tổ chức, mentor và đội thi nhận diện đúng bạn."
      />

      <section className="grid gap-md lg:grid-cols-[1fr_320px]">
        <form className="rounded-xl border border-outline-variant bg-surface-container p-lg" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-md md:grid-cols-2">
            <label className="grid gap-xs font-label-md text-on-surface md:col-span-2">
              Loai sinh vien
              <div className="flex flex-wrap gap-md font-body-md">
                <label className="flex items-center gap-xs">
                  <input
                    type="radio"
                    name="studentType"
                    checked={studentType === "FPT"}
                    disabled={loading}
                    onChange={() => setStudentType("FPT")}
                  />
                  Sinh vien FPT
                </label>
                <label className="flex items-center gap-xs">
                  <input
                    type="radio"
                    name="studentType"
                    checked={studentType === "EXTERNAL"}
                    disabled={loading}
                    onChange={() => setStudentType("EXTERNAL")}
                  />
                  Sinh vien ngoai truong
                </label>
              </div>
            </label>
            <label className="grid gap-xs font-label-md text-on-surface">
              Ho va ten
              <input
                className={`rounded-lg border bg-surface-container-high px-3 py-2 font-body-md text-on-surface ${fieldErrors.fullName ? "border-error" : "border-outline-variant"}`}
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                }}
                disabled={loading}
              />
              {fieldErrors.fullName ? (
                <span className="font-body-sm text-error">{fieldErrors.fullName}</span>
              ) : null}
            </label>
            <label className="grid gap-xs font-label-md text-on-surface">
              Email
              <input
                className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled
              />
            </label>
          </div>
          <div className="mt-md grid gap-md md:grid-cols-2">
            {enableGithubProvisioning ? (
              <label className="grid gap-xs font-label-md text-on-surface md:col-span-2">
                GitHub username
                <input
                  className={`rounded-lg border bg-surface-container-high px-3 py-2 font-body-md text-on-surface ${fieldErrors.githubUsername ? "border-error" : "border-outline-variant"}`}
                  value={githubUsername}
                  onChange={(event) => {
                    setGithubUsername(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, githubUsername: "" }));
                  }}
                  placeholder="ten-tai-khoan-github"
                  disabled={loading}
                />
                {fieldErrors.githubUsername ? (
                  <span className="font-body-sm text-error">{fieldErrors.githubUsername}</span>
                ) : null}
                <span className="font-body-sm text-on-surface-variant">
                  {role === "judge"
                    ? "Cần để BTC cấp quyền xem repository GitHub của đội khi chấm điểm."
                    : "Cần để hệ thống cấp quyền ghi (push) vào repository đội khi mở đề."}
                </span>
              </label>
            ) : null}
            <label className="grid gap-xs font-label-md text-on-surface">
              Ma so sinh vien
              <input
                className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                disabled={loading}
              />
            </label>
            {studentType === "EXTERNAL" ? (
              <label className="grid gap-xs font-label-md text-on-surface">
                Truong
                <input
                  className={`rounded-lg border bg-surface-container-high px-3 py-2 font-body-md text-on-surface ${fieldErrors.university ? "border-error" : "border-outline-variant"}`}
                  value={university}
                  onChange={(event) => {
                    setUniversity(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, university: "" }));
                  }}
                  disabled={loading}
                />
                {fieldErrors.university ? (
                  <span className="font-body-sm text-error">{fieldErrors.university}</span>
                ) : null}
              </label>
            ) : (
              <label className="grid gap-xs font-label-md text-on-surface">
                Truong
                <input
                  className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
                  value={university}
                  onChange={(event) => setUniversity(event.target.value)}
                  placeholder="FPT University"
                  disabled={loading}
                />
              </label>
            )}
          </div>
          {formError && <p className="mt-md font-body-sm text-error">{formError}</p>}
          <Button
            className="mt-lg"
            disabled={saving || loading}
            icon={<Icon name={saving ? "sync" : "save"} />}
            onClick={saveProfile}
          >
            {saving ? "Đang lưu" : "Lưu hồ sơ"}
          </Button>
        </form>

        <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
            <Icon name="person" filled className="text-[32px]" />
          </div>
          <h2 className="mt-md font-headline-sm text-on-surface">{fullName || "Thi sinh"}</h2>
          <p className="break-all font-body-sm text-on-surface-variant">{email || ""}</p>
          <p className="mt-md font-body-sm text-on-surface-variant">
            Hồ sơ này chỉ dùng cho liên hệ trong cuộc thi. Điểm và xếp hạng không bị ảnh hưởng bởi thông tin cá nhân.
          </p>
        </aside>
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <h2 className="font-title-md text-on-surface">
          {hasPassword === true ? "Đổi mật khẩu" : "Đặt mật khẩu"}
        </h2>
        <p className="mt-xs font-body-sm text-on-surface-variant">
          {hasPassword === true
            ? "Dùng khi bạn muốn đăng nhập bằng email thay vì Google."
            : "Tài khoản Google chưa có mật khẩu — đặt tại đây để đăng nhập bằng email."}
        </p>
        {hasPassword === null ? (
          <p className="mt-md font-body-sm text-on-surface-variant">Đang tải thông tin mật khẩu…</p>
        ) : (
        <div className="mt-md grid gap-md md:grid-cols-2">
          {hasPassword === true ? (
            <label className="grid gap-xs font-label-md text-on-surface">
              Mật khẩu hiện tại
              <input
                type="password"
                className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                disabled={loading || passwordSaving}
              />
            </label>
          ) : null}
          <label className={`grid gap-xs font-label-md text-on-surface ${hasPassword === true ? "" : "md:col-span-2"}`}>
            {hasPassword === true ? "Mật khẩu mới" : "Mật khẩu"}
            <input
              type="password"
              className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              disabled={loading || passwordSaving}
            />
          </label>
        </div>
        )}
        {hasPassword !== null ? (
          <>
        <p className="mt-xs font-body-sm text-on-surface-variant">
          ≥15 ký tự, hoặc ≥8 ký tự gồm số và chữ thường.
        </p>
        {passwordError ? <p className="mt-md font-body-sm text-error">{passwordError}</p> : null}
        <Button
          className="mt-lg"
          disabled={
            !newPassword.trim()
            || (hasPassword === true && !currentPassword)
            || passwordSaving
            || loading
          }
          icon={<Icon name={passwordSaving ? "sync" : "lock"} />}
          onClick={() => void savePassword()}
        >
          {passwordSaving ? "Đang lưu" : hasPassword === true ? "Đổi mật khẩu" : "Đặt mật khẩu"}
        </Button>
          </>
        ) : null}
      </section>
    </div>
  );
}
