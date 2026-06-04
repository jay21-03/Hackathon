import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { profileSchema } from "../../domain/schemas";
import { fetchMyProfile, updateMyProfile } from "../../services/profileService";

export function ProfilePage() {
  const { notify } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [university, setUniversity] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);

  const valid = useMemo(() => fullName.trim().length >= 2 && email.includes("@"), [email, fullName]);

  useEffect(() => {
    let active = true;
    fetchMyProfile()
      .then((result) => {
        if (!active) return;
        setFullName(result.fullName ?? "");
        setEmail(result.email ?? "");
        setStudentId(result.studentId ?? "");
        setUniversity(result.university ?? "");
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

  async function saveProfile() {
    const parsed = profileSchema.safeParse({ fullName, email, studentId, university });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Hồ sơ chua hop le.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      const result = await updateMyProfile({
        fullName,
        studentId: studentId || undefined,
        university: university || undefined
      });
      setFullName(result.fullName ?? fullName);
      setStudentId(result.studentId ?? studentId);
      setUniversity(result.university ?? university);
      notify("Đã lưu hồ sơ ca nhan.", "success");
    } catch {
      notify("Lưu hồ sơ thất bại.", "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Hồ sơ ca nhan"
        title="Thông tin thi sinh"
        description="Cập nhật thông tin liên hệ và kỹ năng để ban tổ chức, mentor và đội thi theo dõi đúng người."
      />

      <section className="grid gap-md lg:grid-cols-[1fr_320px]">
        <form className="rounded-xl border border-outline-variant bg-surface-container p-lg" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-md md:grid-cols-2">
            <label className="grid gap-xs font-label-md text-on-surface">
              Ho va ten
              <input
                className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={loading}
              />
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
            <label className="grid gap-xs font-label-md text-on-surface">
              Ma so sinh vien
              <input
                className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                disabled={loading}
              />
            </label>
            <label className="grid gap-xs font-label-md text-on-surface">
              Truong
              <input
                className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
                value={university}
                onChange={(event) => setUniversity(event.target.value)}
                disabled={loading}
              />
            </label>
          </div>
          {formError && <p className="mt-md font-body-sm text-error">{formError}</p>}
          <Button
            className="mt-lg"
            disabled={!valid || saving || loading}
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
    </div>
  );
}
