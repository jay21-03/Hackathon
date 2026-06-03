import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { canViewProblem } from "../../domain/businessRules";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoProblem, demoTeams } from "../../services/readModelService";

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

export function ProblemPage() {
  const team = demoTeams[0];
  const [demoAfterRelease, setDemoAfterRelease] = useState(false);
  const now = demoAfterRelease ? new Date("2026-07-12T09:10:00+07:00") : new Date("2026-06-02T09:00:00+07:00");
  const released = canViewProblem(now, demoProblem.releaseAt);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="De thi"
        title={demoProblem.title}
        description="De chi hien noi dung sau thoi gian mo de. Check-in khong chan quyen xem de."
        actions={
          <>
            <Badge tone={released ? "success" : "warning"}>
              {released ? "Da mo de" : "Chua den gio mo"}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDemoAfterRelease((value) => !value)}
              data-testid="toggle-release-time"
            >
              {demoAfterRelease ? "Xem truoc gio mo de" : "Xem sau gio mo de"}
            </Button>
          </>
        }
      />

      {!released ? (
        <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <Icon name="lock_clock" className="text-5xl text-tertiary" />
          <h2 className="mt-md font-headline-sm text-on-surface">De thi chua duoc mo</h2>
          <p className="mt-xs font-body-md text-on-surface-variant">
            Thoi gian mo de: {formatDate(demoProblem.releaseAt)}. Doi {team.name} van co the check-in va cap nhat ho so truoc khi de mo.
          </p>
        </section>
      ) : (
        <section className="grid gap-lg lg:grid-cols-[1fr_320px]">
          <article className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <div className="flex flex-col gap-md md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-headline-sm text-on-surface">Noi dung de thi</h2>
                <p className="mt-xs font-body-md text-on-surface-variant">{demoProblem.summary}</p>
              </div>
              <Badge tone={getStatusTone(demoProblem.status)}>
                {getStatusLabel(demoProblem.status)}
              </Badge>
            </div>
            <div className="mt-lg space-y-sm">
              {demoProblem.requirements.map((requirement) => (
                <div key={requirement} className="flex gap-sm rounded-lg border border-outline-variant bg-surface-container-low p-md">
                  <Icon name="check_circle" className="text-secondary" />
                  <p className="font-body-sm text-on-surface">{requirement}</p>
                </div>
              ))}
            </div>
          </article>

          <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <h2 className="font-headline-sm text-on-surface">Thong tin thi</h2>
            <div className="mt-md space-y-sm font-body-sm text-on-surface-variant">
              <p>Bang: {demoProblem.board}</p>
              <p>Thoi luong: {demoProblem.durationHours} gio</p>
              <p>Doi thi: {team.name}</p>
            </div>
            <ButtonLink to="/me/submission" className="mt-lg w-full" icon={<Icon name="upload" className="text-[18px]" />}>
              Nop link Git
            </ButtonLink>
          </aside>
        </section>
      )}
    </div>
  );
}
