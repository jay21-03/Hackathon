import { useEffect, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { eventConfigSchema } from "../../domain/schemas";
import { fetchEventDetail, updateEvent, type EventDetail } from "../../services/eventsApi";

export function EventBasicInfoPage() {
  const { notify } = useToast();
  const eventId = "1";
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [name, setName] = useState("");
  const [quota, setQuota] = useState(0);
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(1);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchEventDetail(eventId)
      .then((result) => {
        if (cancelled || !result) return;
        setEvent(result);
        setName(result.name);
        setQuota(result.maxTeams);
        setMinTeamSize(result.minTeamSize);
        setMaxTeamSize(result.maxTeamSize);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Khong tai duoc thong tin cuoc thi.");
        }
      })
      .finally(() => {
        if (!cancelled && !event) {
          setSaving(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    const parsed = eventConfigSchema.safeParse({ name, quota, minTeamSize, maxTeamSize });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Cau hinh cuoc thi chua hop le.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const updated = await updateEvent(eventId, { name, maxTeams: quota });
      if (updated) {
        setEvent(updated);
        setName(updated.name);
        setQuota(updated.maxTeams);
        setMinTeamSize(updated.minTeamSize);
        setMaxTeamSize(updated.maxTeamSize);
      }
      notify("Da luu thong tin cuoc thi.", "success");
    } catch {
      notify("Khong the luu cau hinh cuoc thi.", "danger");
    } finally {
      setSaving(false);
    }
  }

  if (!event) {
    if (loadError) {
      return <p className="rounded-lg border border-error/40 bg-error-container/40 p-md font-body-sm text-on-surface">{loadError}</p>;
    }
    return <ModuleSkeleton rows={5} />;
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
                disabled
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
                disabled
              />
            </label>
          </div>
        </div>
        <p className="mt-md font-body-sm text-on-surface-variant">
          Kich thuoc doi hien dang doc tu cau hinh he thong; trang nay chi cap nhat ten cuoc thi va quota toi da.
        </p>
        {error && <p className="mt-md rounded-lg border border-error/40 bg-error-container p-sm font-body-sm text-on-error-container">{error}</p>}
        <Button className="mt-lg" disabled={saving} icon={<Icon name={saving ? "sync" : "save"} />} onClick={save}>
          {saving ? "Dang luu" : "Luu cau hinh"}
        </Button>
      </section>
    </div>
  );
}
