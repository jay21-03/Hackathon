import { useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { eventConfigSchema } from "../../domain/schemas";
import { demoEvent } from "../../services/demoDataService";

export function EventBasicInfoPage() {
  const { notify } = useToast();
  const [name, setName] = useState(demoEvent.name);
  const [quota, setQuota] = useState(demoEvent.quota);
  const [minTeamSize, setMinTeamSize] = useState(demoEvent.minTeamSize);
  const [maxTeamSize, setMaxTeamSize] = useState(demoEvent.maxTeamSize);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function save() {
    const parsed = eventConfigSchema.safeParse({ name, quota, minTeamSize, maxTeamSize });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Cau hinh cuoc thi chua hop le.");
      return;
    }
    setError("");
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      notify("Da luu thong tin cuoc thi.", "success");
    }, 350);
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Thong tin co ban"
        title="Cau hinh cuoc thi"
        description="Thiet lap thong tin hien thi, quota va kich thuoc doi. Cac rule nay duoc dung trong luong dang ky."
      />

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="grid gap-md md:grid-cols-2">
          <label className="grid gap-xs font-label-md text-on-surface md:col-span-2">
            Ten cuoc thi
            <input
              className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="grid gap-xs font-label-md text-on-surface">
            Quota doi thi
            <input
              className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
              type="number"
              min={1}
              value={quota}
              onChange={(event) => setQuota(Number(event.target.value))}
            />
          </label>
          <div className="grid gap-md sm:grid-cols-2">
            <label className="grid gap-xs font-label-md text-on-surface">
              Toi thieu
              <input
                className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
                type="number"
                min={1}
                max={5}
                value={minTeamSize}
                onChange={(event) => setMinTeamSize(Number(event.target.value))}
              />
            </label>
            <label className="grid gap-xs font-label-md text-on-surface">
              Toi da
              <input
                className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
                type="number"
                min={1}
                max={5}
                value={maxTeamSize}
                onChange={(event) => setMaxTeamSize(Number(event.target.value))}
              />
            </label>
          </div>
        </div>
        {error && <p className="mt-md rounded-lg border border-error/40 bg-error-container p-sm font-body-sm text-on-error-container">{error}</p>}
        <Button className="mt-lg" disabled={saving} icon={<Icon name={saving ? "sync" : "save"} />} onClick={save}>
          {saving ? "Dang luu" : "Luu cau hinh"}
        </Button>
      </section>
    </div>
  );
}
