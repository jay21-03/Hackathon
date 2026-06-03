import { useMemo, useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { useToast } from "../../components/feedback/ToastProvider";
import {
  decideRegistrationStatus,
  validateTeamRegistration
} from "../../domain/businessRules";
import { teamRegistrationSchema } from "../../domain/schemas";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoEvent, existingTeamMembers } from "../../services/readModelService";

const initialMembers = ["captain@seal.edu.vn", "", "", "", ""];

export function TeamRegistrationPage() {
  const { notify } = useToast();
  const [teamName, setTeamName] = useState("CodeStorm");
  const [track, setTrack] = useState("AI / LLM Tooling");
  const [memberEmails, setMemberEmails] = useState(initialMembers);
  const [errors, setErrors] = useState<string[]>([]);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const memberCount = useMemo(
    () => memberEmails.filter((email) => email.trim()).length,
    [memberEmails]
  );

  function updateMember(index: number, value: string) {
    setMemberEmails((current) => current.map((email, i) => (i === index ? value : email)));
  }

  function submitRegistration() {
    const schemaResult = teamRegistrationSchema.safeParse({
      teamName,
      memberEmails: memberEmails.filter((email) => email.trim())
    });
    if (!schemaResult.success) {
      const nextErrors = schemaResult.error.issues.map((issue) => issue.message);
      setErrors(nextErrors);
      notify("Kiem tra lai thong tin dang ky doi.", "warning");
      return;
    }

    const result = validateTeamRegistration(
      {
        eventId: demoEvent.id,
        name: teamName,
        memberEmails
      },
      existingTeamMembers
    );

    setErrors(result.errors);
    if (!result.valid) {
      notify("Kiem tra lai thong tin dang ky doi.", "warning");
      return;
    }

    const nextStatus = decideRegistrationStatus(demoEvent.confirmedTeams, demoEvent.quota);
    setSubmittedStatus(nextStatus);
    notify(`Dang ky thanh cong: ${getStatusLabel(nextStatus)}.`, "success");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-lg">
      <section className="flex flex-col gap-md border-b border-outline-variant pb-lg md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-label-sm normal-case text-primary">Dang ky tham gia</p>
          <h1 className="font-headline-lg text-on-surface">{demoEvent.name}</h1>
          <p className="mt-xs max-w-2xl font-body-md text-on-surface-variant">
            Tao doi thi 1-5 thanh vien. Moi email chi duoc thuoc mot doi trong cung cuoc thi.
          </p>
        </div>
        <Badge tone={getStatusTone(demoEvent.status)}>{getStatusLabel(demoEvent.status)}</Badge>
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
                placeholder="Nhap ten doi"
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
              <h2 className="font-headline-sm text-on-surface">Thanh vien doi</h2>
              <Badge tone={memberCount > 0 && memberCount <= 5 ? "success" : "warning"}>
                {memberCount}/5 thanh vien
              </Badge>
            </div>

            {memberEmails.map((email, index) => (
              <label key={index} className="flex flex-col gap-xs md:flex-row md:items-center">
                <span className="w-28 font-label-sm normal-case text-on-surface-variant">
                  {index === 0 ? "Doi truong" : `Thanh vien ${index + 1}`}
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
                Ho so dang ky: {getStatusLabel(submittedStatus)}
              </p>
              <p className="font-body-sm text-on-surface-variant">
                Ban to chuc se duyet doi va gui loi moi xac nhan cho tung thanh vien.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-sm pt-sm">
            <Button type="submit" data-testid="submit-registration">
              Dang ky doi
              <Icon name="arrow_forward" className="text-[18px]" />
            </Button>
            <ConfirmAction
              title="Lam lai ho so?"
              message="Thong tin doi dang nhap se bi xoa khoi form hien tai."
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
          <h2 className="font-headline-sm text-on-surface">Quy tac dang ky</h2>
          <div className="space-y-sm font-body-sm text-on-surface-variant">
            <p>Quy mo doi: {demoEvent.minTeamSize}-{demoEvent.maxTeamSize} thanh vien.</p>
            <p>Quota: {demoEvent.confirmedTeams}/{demoEvent.quota} doi da xac nhan.</p>
            <p>Quota day thi doi moi vao danh sach cho.</p>
            <p>Mot email khong duoc nam trong hai doi cua cung mot cuoc thi.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
