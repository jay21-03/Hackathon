import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { useToast } from "../../components/feedback/ToastProvider";
import { teamRegistrationSchemaForEvent } from "../../domain/schemas";
import { TextField } from "../../components/ui/FormField";
import { zodFieldErrors } from "../../utils/zodFieldErrors";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { fetchEventDetail, type EventDetail } from "../../services/eventsApi";
import { registerTeam } from "../../services/registrationService";
import { setStoredActiveEventId } from "../../hooks/useActiveEvent";
import { useMyTeam } from "../../hooks/useMyTeam";
import { invalidateAfterTeamMutation } from "../../lib/invalidateAppQueries";
import { getAuthSession } from "../../auth/authSession";
import { getApiErrorMessage } from "../../utils/apiError";
import { createIdempotencyKey } from "../../utils/idempotency";
import {
  canRegisterForEvent,
  isRegistrationStatusOpen,
  mapRegistrationErrorMessage,
  registrationWindowHint
} from "../../utils/registrationErrors";

function buildInitialMembers(contactEmail: string) {
  const slots = ["", "", "", "", ""];
  if (contactEmail.trim()) {
    slots[0] = contactEmail.trim();
  }
  return slots;
}

export function TeamRegistrationPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId: eventIdParam } = useParams();
  const eventId = eventIdParam ? Number(eventIdParam) : null;
  const { team, loading: teamLoading } = useMyTeam(eventId);
  const [eventInfo, setEventInfo] = useState<EventDetail | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [track, setTrack] = useState("");
  const [memberEmails, setMemberEmails] = useState(() => buildInitialMembers(getAuthSession().email));
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const memberCount = useMemo(
    () => memberEmails.filter((email) => email.trim()).length,
    [memberEmails]
  );
  const statusOpen = isRegistrationStatusOpen(eventInfo?.status);
  const registrationOpen = canRegisterForEvent(
    eventInfo?.status,
    eventInfo?.registrationStartAt,
    eventInfo?.registrationEndAt
  );
  const windowHint = registrationWindowHint(
    eventInfo?.registrationStartAt,
    eventInfo?.registrationEndAt
  );
  const minTeamSize = eventInfo?.minTeamSize ?? 1;
  const maxTeamSize = eventInfo?.maxTeamSize ?? 5;

  useEffect(() => {
    if (eventId != null && !Number.isNaN(eventId)) {
      setStoredActiveEventId(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId || Number.isNaN(eventId)) {
      setLoadingEvent(false);
      return;
    }
    fetchEventDetail(String(eventId))
      .then((result) => setEventInfo(result))
      .catch(() => notify("Không tải được thông tin cuộc thi.", "danger"))
      .finally(() => setLoadingEvent(false));
  }, [eventId, notify]);

  function updateMember(index: number, value: string) {
    setMemberEmails((current) => current.map((email, i) => (i === index ? value : email)));
  }

  function buildMemberName(email: string) {
    const local = email.split("@")[0] ?? "";
    if (!local) return "Thành viên";
    return local
      .split(/[._-]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  async function submitRegistration() {
    const schemaResult = teamRegistrationSchemaForEvent(minTeamSize, maxTeamSize).safeParse({
      teamName,
      memberEmails: memberEmails.filter((email) => email.trim())
    });
    if (!schemaResult.success) {
      setFieldErrors(zodFieldErrors(schemaResult.error));
      const nextErrors = schemaResult.error.issues.map((issue) => issue.message);
      setErrors(nextErrors);
      notify("Kiểm tra lại thông tin đăng ký đội.", "warning");
      return;
    }
    setFieldErrors({});

    if (!eventId) {
      notify("Chưa chọn cuộc thi để đăng ký.", "warning");
      return;
    }

    if (!registrationOpen) {
      const statusOnly = (eventInfo?.status ?? "").toUpperCase() !== "REGISTRATION_OPEN";
      notify(
        statusOnly
          ? "Cuộc thi chưa mở đăng ký. Liên hệ ban tổ chức để mở đăng ký."
          : "Ngoài khung thời gian đăng ký của cuộc thi. Kiểm tra lại sau.",
        "warning"
      );
      return;
    }

    setSubmitting(true);
    setErrors([]);
    const filteredEmails = memberEmails.filter((email) => email.trim());
    const payload = {
      name: teamName.trim(),
      members: filteredEmails.map((email) => ({
        email: email.trim(),
        fullName: buildMemberName(email)
      }))
    };

    try {
      const response = await registerTeam(eventId, payload, {
        idempotencyKey: createIdempotencyKey("team-register")
      });
      const status = response.status ?? "PENDING";
      setSubmittedStatus(status);
      await invalidateAfterTeamMutation(queryClient);
      notify(`Đăng ký thành công: ${getStatusLabel(status)}.`, "success");
    } catch (err) {
      const raw = getApiErrorMessage(err, "Đăng ký đội thất bại.");
      const message = mapRegistrationErrorMessage(raw);
      setErrors([message]);
      notify(message, "danger");
    } finally {
      setSubmitting(false);
    }
  }

  if (!eventId || Number.isNaN(eventId)) {
    return <Navigate to="/events" replace />;
  }

  if (!teamLoading && team) {
    return (
      <Navigate
        to="/me"
        replace
        state={{ message: "Bạn đã có đội trong cuộc thi này." }}
      />
    );
  }

  if (!loadingEvent && eventInfo && !statusOpen) {
    return (
      <div className="mx-auto max-w-5xl space-y-lg">
        <Link
          to={`/events/${eventId}`}
          className="inline-flex items-center gap-1 font-label-md text-primary"
        >
          ← Chi tiết cuộc thi
        </Link>
        <p className="rounded-xl border border-outline-variant bg-surface-container p-lg font-body-md text-on-surface-variant">
          Cuộc thi chưa mở đăng ký. Bạn vẫn có thể chọn cuộc thi khác từ danh sách.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-lg">
      <Link
        to={`/events/${eventId}`}
        className="inline-flex items-center gap-1 font-label-md text-primary"
      >
        ← Chi tiết cuộc thi
      </Link>
      <PageHeader
        eyebrow="Đăng ký tham gia"
        title={eventInfo?.name ?? "Đang tải cuộc thi…"}
        description="Tạo đội 1–5 thành viên. Sau khi gửi, BTC duyệt và từng thành viên xác nhận qua email."
        actions={
          <Badge tone={getStatusTone(eventInfo?.status ?? "PENDING")}>
            {getStatusLabel(eventInfo?.status ?? "PENDING")}
          </Badge>
        }
      />

      {!loadingEvent && eventInfo && statusOpen && !registrationOpen && windowHint ? (
        <div className="rounded-xl border border-warning/40 bg-warning-container/30 p-md font-body-sm text-on-surface">
          {windowHint} Bạn có thể điền form trước; hệ thống chỉ nhận hồ sơ khi đúng khung thời gian.
        </div>
      ) : null}

      <div className="grid gap-lg lg:grid-cols-[1fr_320px]">
        <form
          className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg"
          onSubmit={(event) => {
            event.preventDefault();
            void submitRegistration();
          }}
        >
          <div className="grid gap-md md:grid-cols-2">
            <TextField
              label="Tên đội"
              required
              data-testid="team-name"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Nhập tên đội"
              error={fieldErrors.teamName}
            />
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm normal-case text-on-surface-variant">Track (tham khảo)</span>
              <select value={track} onChange={(event) => setTrack(event.target.value)} className="form-input">
                <option value="">— Chọn track —</option>
                <option>AI / LLM Tooling</option>
                <option>Cybersecurity Defense</option>
                <option>Fintech & DeFi</option>
                <option>Hardware / IoT Edge</option>
              </select>
            </label>
          </div>

          <div className="space-y-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-on-surface">Thành viên đội</h2>
              <Badge tone={memberCount > 0 && memberCount <= 5 ? "success" : "warning"}>
                {memberCount}/5 thành viên
              </Badge>
            </div>

            {memberEmails.map((email, index) => (
              <label key={index} className="flex flex-col gap-xs md:flex-row md:items-center">
                <span className="w-28 font-label-sm normal-case text-on-surface-variant">
                  {index === 0 ? "Đội trưởng" : `Thành viên ${index + 1}`}
                </span>
                <input
                  data-testid={`member-email-${index}`}
                  value={email}
                  onChange={(event) => updateMember(index, event.target.value)}
                  className="form-input flex-1"
                  placeholder="email@seal.edu.vn"
                  type="email"
                />
              </label>
            ))}
          </div>

          {errors.length > 0 && (
            <div className="rounded-lg border border-error/40 bg-error-container/70 p-md text-on-error-container">
              {errors.map((error) => (
                <p key={error} className="font-body-sm">
                  {error}
                </p>
              ))}
            </div>
          )}

          {submittedStatus && (
            <div
              data-testid="registration-result"
              className="rounded-lg border border-secondary/30 bg-secondary-container/30 p-md"
            >
              <p className="font-label-md text-on-surface">
                Hồ sơ đăng ký: {getStatusLabel(submittedStatus)}
              </p>
              <p className="font-body-sm text-on-surface-variant">
                Ban tổ chức sẽ duyệt đội và gửi lời mời xác nhận cho từng thành viên.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-sm pt-sm">
            <Button
              type="submit"
              data-testid="submit-registration"
              disabled={submitting || loadingEvent || !registrationOpen}
              icon={<Icon name="group_add" className="text-[18px]" />}
            >
              {submitting || loadingEvent ? "Đang gửi…" : "Đăng ký đội"}
            </Button>
            <ConfirmAction
              title="Làm lại hồ sơ?"
              message="Thông tin đội đang nhập sẽ bị xóa khỏi form hiện tại."
              confirmLabel="Làm lại"
              onConfirm={() => {
                setTeamName("");
                setMemberEmails(buildInitialMembers(getAuthSession().email));
                setErrors([]);
                setSubmittedStatus(null);
              }}
            >
              <Button type="button" variant="ghost">
                Làm lại
              </Button>
            </ConfirmAction>
          </div>
        </form>

        <aside className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Quy tắc đăng ký</h2>
          <div className="space-y-sm font-body-sm text-on-surface-variant">
            <p>
              Quy mô đội: {eventInfo?.minTeamSize ?? 1}–{eventInfo?.maxTeamSize ?? 5} thành viên.
            </p>
            <p>Quota: tối đa {eventInfo?.maxTeams ?? "—"} đội.</p>
            <p>Quota đầy thì đội mới vào danh sách chờ.</p>
            <p>Một email không được nằm trong hai đội của cùng một cuộc thi.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
