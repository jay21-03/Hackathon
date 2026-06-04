import { useEffect, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { eventConfigSchema } from "../../domain/schemas";
import { EventSelector } from "../../components/ui/EventSelector";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { fetchEventDetail, updateEvent, type EventDetail } from "../../services/eventsApi";

export function EventBasicInfoPage() {
  const { notify } = useToast();
  const { eventId, events, setEventId, loading: eventsLoading } = useActiveEvent();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [name, setName] = useState("");
  const [quota, setQuota] = useState(0);
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(1);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    fetchEventDetail(String(eventId))
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
          setLoadError("Không tải được thông tin cuộc thi.");
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
  }, [eventId]);

  async function save() {
    if (!eventId) return;
    const parsed = eventConfigSchema.safeParse({ name, quota, minTeamSize, maxTeamSize });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Cấu hình cuộc thi chưa hợp lệ.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const updated = await updateEvent(String(eventId), { name, maxTeams: quota });
      if (updated) {
        setEvent(updated);
        setName(updated.name);
        setQuota(updated.maxTeams);
        setMinTeamSize(updated.minTeamSize);
        setMaxTeamSize(updated.maxTeamSize);
      }
      notify("Đã lưu thông tin cuộc thi.", "success");
    } catch {
      notify("Không thể lưu cấu hình cuộc thi.", "danger");
    } finally {
      setSaving(false);
    }
  }

  if (eventsLoading || (!event && !loadError && eventId)) {
    return <ModuleSkeleton rows={5} />;
  }

  if (!eventId) {
    return <p className="rounded-lg border border-outline-variant bg-surface-container p-md font-body-sm">Chưa có cuộc thi.</p>;
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
        eyebrow="Thông tin cơ bản"
        title="Cấu hình cuộc thi"
        description="Thiết lập thông tin hiển thị, quota và kích thước đội. Các rule này được dùng trong luồng đăng ký."
        actions={
          <EventSelector events={events} eventId={eventId} onChange={setEventId} />
        }
      />

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="grid gap-md md:grid-cols-2">
          <label className="grid gap-xs font-label-md text-on-surface md:col-span-2">
            Tên cuộc thi
            <input
              className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-md text-on-surface"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="grid gap-xs font-label-md text-on-surface">
            Quota đội thi
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
              Tối thiểu
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
              Tối đa
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
          Kích thước đội hiện đang đọc từ cấu hình hệ thống; trang này chỉ cập nhật tên cuộc thi và quota tối đa.
        </p>
        {error && <p className="mt-md rounded-lg border border-error/40 bg-error-container p-sm font-body-sm text-on-error-container">{error}</p>}
        <Button className="mt-lg" disabled={saving} icon={<Icon name={saving ? "sync" : "save"} />} onClick={save}>
          {saving ? "Đang lưu" : "Lưu cấu hình"}
        </Button>
      </section>
    </div>
  );
}
