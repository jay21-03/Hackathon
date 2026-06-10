import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../components/feedback/ToastProvider";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { eventConfigSaveSchemaForTerm } from "../../domain/schemas";
import { TextField } from "../../components/ui/FormField";
import { enableAcademicTerms } from "../../config/features";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useActiveTerm } from "../../hooks/useActiveTerm";
import { invalidateAfterTeamMutation } from "../../lib/invalidateAppQueries";
import { queryKeys } from "../../lib/queryKeys";
import { Badge } from "../../components/ui/Badge";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { openEventRegistration, updateEvent, type EventDetail } from "../../services/eventsApi";
import { useEventDetail } from "../../hooks/useEventDetail";
import { canOpenRegistration, isRegistrationOpen } from "../../utils/registrationErrors";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";
import { toIsoFromLocal, toLocalDateInput, toLocalDateTimeInput } from "../../utils/dateTimeInput";
import { zodFieldErrors } from "../../utils/zodFieldErrors";
import type { HubEmbedProps } from "../../utils/hubEmbedUtils";

export function EventBasicInfoPage({ embedded = false }: HubEmbedProps = {}) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, loading: eventsLoading } = useActiveEvent({ autoSelectFirst: true });
  const { terms } = useActiveTerm();
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
  const [academicTermId, setAcademicTermId] = useState<number | "">("");
  const { steps: setupSteps, loading: setupLoading } = useEventSetupProgress(
    eventId,
    embedded ? "/organizer/events/wizard" : "/organizer/events/basic-info"
  );

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
    setAcademicTermId(fetchedEvent.academicTermId ?? "");
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
    const resolvedTermId = academicTermId !== "" ? Number(academicTermId) : event?.academicTermId;
    const selectedTerm = terms.find((term) => term.id === resolvedTermId);
    const parsed = eventConfigSaveSchemaForTerm(selectedTerm?.startDate, selectedTerm?.endDate).safeParse({
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
        registrationEndAt: toIsoFromLocal(parsed.data.registrationEndAt),
        ...(enableAcademicTerms && academicTermId !== ""
          ? { academicTermId: Number(academicTermId) }
          : {})
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
      applyApiFormErrors(err, setFieldErrors, { maxTeams: "quota" });
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
      {!embedded ? (
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
              <OrganizerContextBar />
            </>
          }
        />
      ) : (
        <div className="flex flex-wrap items-center gap-sm">
          <Badge tone={getStatusTone(event.status)}>{getStatusLabel(event.status)}</Badge>
          <span className="font-label-md text-on-surface">{event.name}</span>
        </div>
      )}

      {!embedded ? (
        <WorkflowSteps
          title="Quy trình thiết lập"
          description="Cùng thứ tự với sidebar — trạng thái tính từ dữ liệu thật."
          steps={setupSteps}
        />
      ) : null}

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
          {enableAcademicTerms ? (
            <div className="md:col-span-2">
              <label className="space-y-1">
                <span className="font-label-sm text-on-surface-variant">Học kỳ</span>
                <select
                  value={academicTermId}
                  onChange={(e) =>
                    setAcademicTermId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2"
                >
                  {terms
                    .filter((t) => t.status === "ACTIVE")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code}
                      </option>
                    ))}
                </select>
                <p className="font-label-sm text-on-surface-variant">
                  Không đổi được kỳ sau khi đã có đội, điểm, ranking hoặc repository.
                </p>
              </label>
            </div>
          ) : null}
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
          <p className="md:col-span-2 font-body-sm text-on-surface-variant">
            Ngày và giờ hiển thị theo múi giờ trên máy bạn (datetime-local).
          </p>
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
