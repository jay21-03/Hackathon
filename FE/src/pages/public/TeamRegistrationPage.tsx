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
import { useEventDetail } from "../../hooks/useEventDetail";
import { registerTeam } from "../../services/registrationService";
import { fetchMyProfile } from "../../services/profileService";
import { setStoredActiveEventId } from "../../hooks/useActiveEvent";
import { useMyTeam } from "../../hooks/useMyTeam";
import { invalidateAfterTeamMutation } from "../../lib/invalidateAppQueries";
import { getAuthSession } from "../../auth/authSession";
import { resolveApiError } from "../../utils/apiError";
import { createIdempotencyKey } from "../../utils/idempotency";
import {
  applyRegistrationFormErrors,
  canRegisterForEvent,
  isRegistrationStatusOpen,
  mapRegistrationErrorMessage,
  registrationWindowHint
} from "../../utils/registrationErrors";

type MemberFormRow = { email: string; studentId: string; university: string };
type LeaderProfile = { email: string; studentId: string; university: string };

function buildInitialMembers(profile: LeaderProfile): MemberFormRow[] {
  return Array.from({ length: 5 }, (_, index) => ({
    email: index === 0 ? profile.email.trim() : "",
    studentId: index === 0 ? profile.studentId.trim() : "",
    university: index === 0 ? profile.university.trim() : ""
  }));
}

function initialLeaderProfile(): LeaderProfile {
  return {
    email: getAuthSession().email,
    studentId: "",
    university: ""
  };
}

export function TeamRegistrationPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId: eventIdParam } = useParams();
  const eventId = eventIdParam ? Number(eventIdParam) : null;
  const { team, loading: teamLoading } = useMyTeam(eventId);
  const { event: eventInfo, loading: loadingEvent, error: eventError } = useEventDetail(eventId);
  const [teamName, setTeamName] = useState("");
  const [leaderProfile, setLeaderProfile] = useState<LeaderProfile>(() => initialLeaderProfile());
  const [members, setMembers] = useState<MemberFormRow[]>(() => buildInitialMembers(initialLeaderProfile()));
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [memberFieldErrors, setMemberFieldErrors] = useState<Record<number, Record<string, string>>>({});
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const memberCount = useMemo(() => members.filter((member) => member.email.trim()).length, [members]);
  const statusOpen = isRegistrationStatusOpen(eventInfo?.status);
  const registrationOpen = canRegisterForEvent(
    eventInfo?.status,
    eventInfo?.registrationStartAt,
    eventInfo?.registrationEndAt
  );
  const windowHint = registrationWindowHint(eventInfo?.registrationStartAt, eventInfo?.registrationEndAt);
  const minTeamSize = eventInfo?.minTeamSize ?? 1;
  const maxTeamSize = eventInfo?.maxTeamSize ?? 5;

  useEffect(() => {
    if (eventId != null && !Number.isNaN(eventId)) {
      setStoredActiveEventId(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventError) notify(eventError, "danger");
  }, [eventError, notify]);

  useEffect(() => {
    let cancelled = false;

    fetchMyProfile()
      .then((profile) => {
        if (cancelled) return;

        const nextProfile = {
          email: profile.email ?? getAuthSession().email,
          studentId: profile.studentId ?? "",
          university: profile.university ?? ""
        };
        setLeaderProfile(nextProfile);
        setMembers((current) =>
          current.map((row, index) => {
            if (index !== 0) return row;

            const canUseProfileEmail =
              !row.email.trim() || row.email.trim().toLowerCase() === nextProfile.email.trim().toLowerCase();

            if (!canUseProfileEmail) return row;

            return {
              email: row.email.trim() ? row.email : nextProfile.email,
              studentId: row.studentId.trim() ? row.studentId : nextProfile.studentId,
              university: row.university.trim() ? row.university : nextProfile.university
            };
          })
        );
      })
      .catch(() => {
        /* Registration still works if the profile prefill endpoint is unavailable. */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function updateMember(index: number, patch: Partial<MemberFormRow>) {
    setMembers((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setMemberFieldErrors((current) => {
      const next = { ...current };
      const row = next[index];
      if (!row) return next;
      const rowNext = { ...row };
      for (const key of Object.keys(patch)) {
        delete rowNext[key];
      }
      if (Object.keys(rowNext).length === 0) {
        delete next[index];
      } else {
        next[index] = rowNext;
      }
      return next;
    });
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
    const activeMembers = members.filter((member) => member.email.trim());
    const schemaResult = teamRegistrationSchemaForEvent(minTeamSize, maxTeamSize).safeParse({
      teamName,
      members: activeMembers
    });
    if (!schemaResult.success) {
      setFieldErrors(zodFieldErrors(schemaResult.error));
      const nextErrors = schemaResult.error.issues.map((issue) => issue.message);
      setErrors(nextErrors);
      notify("Kiểm tra lại thông tin đăng ký đội.", "warning");
      return;
    }
    setFieldErrors({});
    setMemberFieldErrors({});

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
    const payload = {
      name: teamName.trim(),
      members: activeMembers.map((member) => ({
        email: member.email.trim(),
        fullName: buildMemberName(member.email),
        studentId: member.studentId.trim(),
        university: member.university.trim()
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
      if (!applyRegistrationFormErrors(err, setFieldErrors, setMemberFieldErrors)) {
        const raw = resolveApiError(err, "Đăng ký đội thất bại.");
        const message = mapRegistrationErrorMessage(raw);
        setErrors([message]);
        notify(message, "danger");
      } else {
        notify("Kiểm tra lại thông tin đăng ký đội.", "warning");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!eventId || Number.isNaN(eventId)) {
    return <Navigate to="/events" replace />;
  }

  if (!teamLoading && team) {
    return <Navigate to="/me" replace state={{ message: "Bạn đã có đội trong cuộc thi này." }} />;
  }

  if (!loadingEvent && eventInfo && !statusOpen) {
    return (
      <div className="mx-auto max-w-5xl space-y-lg">
        <Link to={`/events/${eventId}`} className="inline-flex items-center gap-1 font-label-md text-primary">
          ← Chi tiết cuộc thi
        </Link>
        <p className="rounded-xl border border-outline-variant bg-surface-container p-md font-body-md text-on-surface-variant">
          Cuộc thi chưa mở đăng ký. Bạn vẫn có thể chọn cuộc thi khác từ danh sách.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-lg">
      <Link to={`/events/${eventId}`} className="inline-flex items-center gap-1 font-label-md text-primary">
        ← Chi tiết cuộc thi
      </Link>
      <PageHeader
        eyebrow="Đăng ký tham gia"
        title={eventInfo?.name ?? "Đang tải cuộc thi…"}
        description={
          eventInfo
            ? `Tạo đội ${eventInfo.minTeamSize}–${eventInfo.maxTeamSize} thành viên. Thành viên xác nhận email trước, sau đó BTC duyệt (hoặc vào danh sách chờ nếu hết quota).`
            : "Tạo đội theo quy mô cuộc thi. Thành viên xác nhận email trước, sau đó BTC duyệt (hoặc vào danh sách chờ nếu hết quota)."
        }
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

      <div className="grid gap-md lg:grid-cols-[1fr_320px]">
        <form
          className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-md"
          onSubmit={(event) => {
            event.preventDefault();
            void submitRegistration();
          }}
        >
          <TextField
            label="Tên đội"
            required
            data-testid="team-name"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="Nhập tên đội"
            error={fieldErrors.teamName}
          />

          <div className="space-y-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-on-surface">Thành viên đội</h2>
              <Badge tone={memberCount > 0 && memberCount <= 5 ? "success" : "warning"}>
                {memberCount}/5 thành viên
              </Badge>
            </div>

            {members.map((member, index) => {
              const rowErrors = memberFieldErrors[index] ?? {};
              return (
                <div
                  key={index}
                  className="grid gap-sm rounded-lg border border-outline-variant/60 p-sm md:grid-cols-4"
                >
                  <label className="flex flex-col gap-xs md:col-span-2">
                    <span className="font-label-sm normal-case text-on-surface-variant">
                      {index === 0 ? "Đội trưởng — Email" : `Thành viên ${index + 1} — Email`}
                    </span>
                    <input
                      data-testid={`member-email-${index}`}
                      value={member.email}
                      onChange={(event) => updateMember(index, { email: event.target.value })}
                      className={`form-input${rowErrors.email ? " border-error" : ""}`}
                      placeholder="email@seal.edu.vn"
                      type="email"
                    />
                    {rowErrors.email ? (
                      <span className="font-body-sm text-error">{rowErrors.email}</span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-xs">
                    <span className="font-label-sm normal-case text-on-surface-variant">MSSV</span>
                    <input
                      data-testid={`member-student-id-${index}`}
                      value={member.studentId}
                      onChange={(event) => updateMember(index, { studentId: event.target.value })}
                      className={`form-input${rowErrors.studentId ? " border-error" : ""}`}
                      placeholder="SE123456"
                    />
                    {rowErrors.studentId ? (
                      <span className="font-body-sm text-error">{rowErrors.studentId}</span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-xs">
                    <span className="font-label-sm normal-case text-on-surface-variant">Trường</span>
                    <input
                      data-testid={`member-university-${index}`}
                      value={member.university}
                      onChange={(event) => updateMember(index, { university: event.target.value })}
                      className={`form-input${rowErrors.university ? " border-error" : ""}`}
                      placeholder="Đại học …"
                    />
                    {rowErrors.university ? (
                      <span className="font-body-sm text-error">{rowErrors.university}</span>
                    ) : null}
                  </label>
                </div>
              );
            })}
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
                setMembers(buildInitialMembers(leaderProfile));
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

        <aside className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-md">
          <h2 className="font-headline-sm text-on-surface">Quy tắc đăng ký</h2>
          <div className="space-y-sm font-body-sm text-on-surface-variant">
            <p>
              Quy mô đội: {eventInfo?.minTeamSize ?? 1}–{eventInfo?.maxTeamSize ?? 5} thành viên.
            </p>
            <p>Quota: tối đa {eventInfo?.maxTeams ?? "—"} đội.</p>
            <p>Quota đầy thì đội mới vào danh sách chờ.</p>
            <p>Một email không được nằm trong hai đội của cùng một cuộc thi.</p>
            <p>MSSV và trường là bắt buộc cho mỗi thành viên có email.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
