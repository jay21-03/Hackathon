import { useMemo, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { profileSchema } from "../../domain/schemas";
import { demoTeamMembers } from "../../services/readModelService";

export function ProfilePage() {
  const { notify } = useToast();
  const member = demoTeamMembers[0];
  const [fullName, setFullName] = useState(member.fullName);
  const [email, setEmail] = useState(member.email);
  const [skill, setSkill] = useState("Frontend, UX, React");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const valid = useMemo(() => fullName.trim().length >= 2 && email.includes("@"), [email, fullName]);

  function saveProfile() {
    const parsed = profileSchema.safeParse({ fullName, email, skill });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Ho so chua hop le.");
      return;
    }
    setFormError("");
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      notify("Da luu ho so ca nhan.", "success");
    }, 350);
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Ho so ca nhan"
        title="Thong tin thi sinh"
        description="Cap nhat thong tin lien he va ky nang de ban to chuc, mentor va doi thi theo doi dung nguoi."
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
              />
            </label>
            <label className="grid gap-xs font-label-md text-on-surface">
              Email
              <input
                className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          </div>
          <label className="mt-md grid gap-xs font-label-md text-on-surface">
            Ky nang chinh
            <textarea
              className="min-h-28 rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
              value={skill}
              onChange={(event) => setSkill(event.target.value)}
            />
          </label>
          {formError && <p className="mt-md font-body-sm text-error">{formError}</p>}
          <Button
            className="mt-lg"
            disabled={!valid || saving}
            icon={<Icon name={saving ? "sync" : "save"} />}
            onClick={saveProfile}
          >
            {saving ? "Dang luu" : "Luu ho so"}
          </Button>
        </form>

        <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
            <Icon name="person" filled className="text-[32px]" />
          </div>
          <h2 className="mt-md font-headline-sm text-on-surface">{fullName}</h2>
          <p className="break-all font-body-sm text-on-surface-variant">{email}</p>
          <p className="mt-md font-body-sm text-on-surface-variant">
            Ho so nay chi dung cho lien he trong cuoc thi. Diem va ranking khong bi anh huong boi thong tin ca nhan.
          </p>
        </aside>
      </section>
    </div>
  );
}
