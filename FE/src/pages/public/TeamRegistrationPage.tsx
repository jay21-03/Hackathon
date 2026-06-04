import { useEffect, useMemo, useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { useToast } from "../../components/feedback/ToastProvider";
import { teamRegistrationSchema } from "../../domain/schemas";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { fetchEventDetail, type EventDetail } from "../../services/eventsApi";
import { registerTeam } from "../../services/registrationService";
import { useActiveEvent } from "../../hooks/useActiveEvent";

const initialMembers = ["", "", "", "", ""];

export function TeamRegistrationPage() {
  const { notify } = useToast();
  const { eventId } = useActiveEvent();
  const [eventInfo, setEventInfo] = useState<EventDetail | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [track, setTrack] = useState("");
  const [memberEmails, setMemberEmails] = useState(initialMembers);
  const [errors, setErrors] = useState<string[]>([]);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const memberCount = useMemo(
    () => memberEmails.filter((email) => email.trim()).length,
    [memberEmails]
  );

  useEffect(() => {
    if (!eventId) {
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
    const schemaResult = teamRegistrationSchema.safeParse({
      teamName,
      memberEmails: memberEmails.filter((email) => email.trim())
    });
    if (!schemaResult.success) {
      const nextErrors = schemaResult.error.issues.map((issue) => issue.message);
      setErrors(nextErrors);
      notify("Kiểm tra lại thông tin đăng ký đội.", "warning");
      return;
    }

    if (!eventId) {
      notify("Chưa chọn cuộc thi để đăng ký.", "warning");
      return;
    }

    setSubmitting(true);
    const filteredEmails = memberEmails.filter((email) => email.trim());
    const payload = {
      name: teamName.trim(),
      members: filteredEmails.map((email) => ({
        email: email.trim(),
        fullName: buildMemberName(email)
      }))
    };

    try {
      const response = await registerTeam(eventId, payload);
      const status = response.status ?? "PENDING";
      setSubmittedStatus(status);
      notify(`Đăng ký thành công: ${getStatusLabel(status)}.`, "success");
      return;
    } catch {
      notify("Đăng ký đội thất bại. Vui lòng thử lại.", "danger");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-lg">
      <section className="flex flex-col gap-md border-b border-outline-variant pb-lg md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-label-sm normal-case text-primary">Đăng ký tham gia</p>
          <h1 className="font-headline-lg text-on-surface">{eventInfo?.name ?? "Đang tải cuộc thi..."}</h1>
          <p className="mt-xs max-w-2xl font-body-md text-on-surface-variant">
            Tạo đội thi 1-5 thành viên. Mỗi email chỉ được thuộc một đội trong cùng cuộc thi.
          </p>
        </div>
        <Badge tone={getStatusTone(eventInfo?.status ?? "PENDING")}>{getStatusLabel(eventInfo?.status ?? "PENDING")}</Badge>
      </section>

      <div className="grid gap-lg lg:grid-cols-[1fr_320px]">
        <form
          className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg"
          onSubmit={(event) => {
            event.preventDefault();
            submitRegistration();
          }}
        >
          <div className="grid gap-md md:grid-cols-2">
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm normal-case text-on-surface-variant">Ten doi</span>
              <input
                data-testid="team-name"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                className="form-input"
                placeholder="Nhập tên đội"
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm normal-case text-on-surface-variant">Track</span>
              <select
                value={track}
                onChange={(event) => setTrack(event.target.value)}
                className="form-input"
              >
                <option>AI / LLM Tooling</option>
                <option>Cybersecurity Defense</option>
                <option>Fintech & DeFi</option>
                <option>Hardware / IoT Edge</option>
              </select>
            </label>
          </div>

          <div className="space-y-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-on-surface">Thành viên doi</h2>
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
              disabled={submitting}
              icon={<Icon name="group_add" className="text-[18px]" />}
            >
              {submitting || loadingEvent ? "Đang gửi" : "Đăng ký đội"}
            </Button>
            <ConfirmAction
              title="Lam lai hồ sơ?"
              message="Thông tin đội đang nhập sẽ bị xóa khỏi form hiện tại."
              confirmLabel="Lam lai"
              onConfirm={() => {
                setTeamName("");
                setMemberEmails(["", "", "", "", ""]);
                setErrors([]);
                setSubmittedStatus(null);
              }}
            >
              <Button type="button" variant="ghost">
                Lam lai
              </Button>
            </ConfirmAction>
          </div>
        </form>

        <aside className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Quy tac đăng ký</h2>
          <div className="space-y-sm font-body-sm text-on-surface-variant">
            <p>Quy mo doi: {eventInfo?.minTeamSize ?? 1}-{eventInfo?.maxTeamSize ?? 5} thành viên.</p>
            <p>Quota: toi da {eventInfo?.maxTeams ?? "-"} doi.</p>
            <p>Quota đầy thì đội mới vào danh sách chờ.</p>
            <p>Một email không được nằm trong hai đội của cùng một cuộc thi.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
