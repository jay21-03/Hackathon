import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../components/feedback/ToastProvider";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { eventConfigSaveSchema } from "../../domain/schemas";
import { TextField } from "../../components/ui/FormField";
import { EventSelector } from "../../components/ui/EventSelector";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { invalidateAfterTeamMutation } from "../../lib/invalidateAppQueries";
import { queryKeys } from "../../lib/queryKeys";
import { Badge } from "../../components/ui/Badge";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { openEventRegistration, updateEvent, type EventDetail } from "../../services/eventsApi";
import { useEventDetail } from "../../hooks/useEventDetail";
import { canOpenRegistration, isRegistrationOpen } from "../../utils/registrationErrors";
import { resolveApiError } from "../../utils/apiError";
import { toIsoFromLocal, toLocalDateInput, toLocalDateTimeInput } from "../../utils/dateTimeInput";
import { zodFieldErrors } from "../../utils/zodFieldErrors";

export function EventBasicInfoPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, events, setEventId, loading: eventsLoading } = useActiveEvent({ autoSelectFirst: true });
  const { event: fetchedEvent, loading: detailLoading, error: detailQueryError, refetch } = useEventDetail(eventId);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [name, setName] = useState("");
  const [quota, setQuota] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationStartAt, setRegistrationStartAt] = useState("");
  const [registrationEndAt, setRegistrationEndAt] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);
  const { steps: setupSteps, loading: setupLoading } = useEventSetupProgress(eventId, "/organizer/events/basic-info");

  useEffect(() => {
    if (!fetchedEvent) return;
    setEvent(fetchedEvent);
    setName(fetchedEvent.name);
    setQuota(fetchedEvent.maxTeams);
    setStartDate(toLocalDateInput(fetchedEvent.startDate));
    setEndDate(toLocalDateInput(fetchedEvent.endDate));
    setRegistrationStartAt(
      fetchedEvent.registrationStartAt ? toLocalDateTimeInput(fetchedEvent.registrationStartAt) : ""
    );
    setRegistrationEndAt(
      fetchedEvent.registrationEndAt ? toLocalDateTimeInput(fetchedEvent.registrationEndAt) : ""
    );
    setLoadError("");
  }, [fetchedEvent]);

  useEffect(() => {
    if (detailQueryError) setLoadError(detailQueryError);
  }, [detailQueryError]);

  async function openRegistration() {
    if (!eventId) return;
    if (!canOpenRegistration(event?.registrationEndAt)) {
      notify("Đã qua hạn đóng đăng ký — cập nhật thời gian đăng ký trước.", "warning");
      return;
    }
    setOpening(true);
    try {
      const updated = await openEventRegistration(String(eventId));
      if (updated) {
        setEvent(updated);
      }
      await invalidateAfterTeamMutation(queryClient);
      await queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(String(eventId)) });
      await refetch();
      notify("Đã mở đăng ký cho thí sinh.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Không mở được đăng ký."), "danger");
    } finally {
      setOpening(false);
    }
  }

  async function save() {
    if (!eventId) return;
    const parsed = eventConfigSaveSchema.safeParse({
      name,
      quota,
      startDate,
      endDate,
      registrationStartAt,
      registrationEndAt
    });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const updated = await updateEvent(String(eventId), {
        name: parsed.data.name,
        maxTeams: parsed.data.quota,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        registrationStartAt: toIsoFromLocal(parsed.data.registrationStartAt),
        registrationEndAt: toIsoFromLocal(parsed.data.registrationEndAt)
      });
      if (updated) {
        setEvent(updated);
        setName(updated.name);
        setQuota(updated.maxTeams);
        setStartDate(toLocalDateInput(updated.startDate));
        setEndDate(toLocalDateInput(updated.endDate));
        setRegistrationStartAt(
          updated.registrationStartAt ? toLocalDateTimeInput(updated.registrationStartAt) : ""
        );
        setRegistrationEndAt(
          updated.registrationEndAt ? toLocalDateTimeInput(updated.registrationEndAt) : ""
        );
      }
      await invalidateAfterTeamMutation(queryClient);
      await queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(String(eventId)) });
      await refetch();
      notify("Đã lưu thông tin cuộc thi.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Không thể lưu cấu hình cuộc thi."), "danger");
    } finally {
      setSaving(false);
    }
  }

  if (eventsLoading || detailLoading || setupLoading || (!event && !loadError && eventId)) {
    return <ModuleSkeleton rows={5} />;
  }

  if (!eventId) {
    return (
      <p className="rounded-lg border border-outline-variant bg-surface-container p-md font-body-sm">
        Chưa có cuộc thi.
      </p>
    );
  }

  if (!event) {
    if (loadError) {
      return (
        <p className="rounded-lg border border-error/40 bg-error-container/40 p-md font-body-sm text-on-surface">
          {loadError}
        </p>
      );
    }
    return <ModuleSkeleton rows={5} />;
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Cuộc thi"
        title={event.name}
        description="Chỉnh sửa thông tin và hoàn tất các bước thiết lập bên dưới."
        actions={
          <>
            <ButtonLink to="/organizer/events" variant="ghost" icon={<Icon name="arrow_back" />}>
              Danh sách
            </ButtonLink>
            <Badge tone={getStatusTone(event.status)}>{getStatusLabel(event.status)}</Badge>
            <EventSelector events={events} eventId={eventId} onChange={setEventId} />
          </>
        }
      />

      <WorkflowSteps
        title="Quy trình thiết lập"
        description="Cùng thứ tự với sidebar — trạng thái tính từ dữ liệu thật."
        steps={setupSteps}
      />

      {!isRegistrationOpen(event.status) ? (
        <section className="flex flex-col gap-md rounded-xl border border-warning/40 bg-warning-container/30 p-md sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body-sm text-on-surface">
            Thí sinh chưa thể đăng ký đội khi cuộc thi ở trạng thái <strong>{getStatusLabel(event.status)}</strong>.
          </p>
          <Button
            variant="secondary"
            disabled={opening}
            icon={<Icon name={opening ? "sync" : "how_to_reg"} />}
            onClick={openRegistration}
          >
            {opening ? "Đang mở…" : "Mở đăng ký"}
          </Button>
        </section>
      ) : null}

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <h2 className="font-headline-sm text-on-surface">Thông tin & lịch</h2>
        <p className="mt-xs font-body-sm text-on-surface-variant">
          Cập nhật khung đăng ký và ngày thi — lưu để áp dụng cho thí sinh.
        </p>
        <div className="mt-md grid gap-md md:grid-cols-2">
          <div className="md:col-span-2">
            <TextField
              label="Tên cuộc thi"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name}
            />
          </div>
          <TextField
            label="Ngày bắt đầu thi"
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={fieldErrors.startDate}
          />
          <TextField
            label="Ngày kết thúc thi"
            required
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            error={fieldErrors.endDate}
          />
          <TextField
            label="Mở đăng ký"
            required
            type="datetime-local"
            value={registrationStartAt}
            onChange={(e) => setRegistrationStartAt(e.target.value)}
            error={fieldErrors.registrationStartAt}
          />
          <TextField
            label="Đóng đăng ký"
            required
            type="datetime-local"
            value={registrationEndAt}
            onChange={(e) => setRegistrationEndAt(e.target.value)}
            error={fieldErrors.registrationEndAt}
          />
          <TextField
            label="Quota đội thi"
            required
            type="number"
            min={1}
            value={quota}
            onChange={(e) => setQuota(Number(e.target.value))}
            error={fieldErrors.quota}
            helper={`Quy mô đội: ${event.minTeamSize}–${event.maxTeamSize} thành viên (cố định hệ thống).`}
          />
        </div>
        <Button className="mt-lg" disabled={saving} icon={<Icon name={saving ? "sync" : "save"} />} onClick={save}>
          {saving ? "Đang lưu…" : "Lưu cấu hình"}
        </Button>
      </section>
    </div>
  );
}
