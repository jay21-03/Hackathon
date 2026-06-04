import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { fetchBoardProblems, fetchEventRounds, fetchRoundBoards } from "../../services/contestApi";
import { fetchEventTeams } from "../../services/registrationService";

type StepStatus = "CONFIRMED" | "PENDING";

export function EventWizardPage() {
  const { eventId, loading } = useActiveEvent();
  const [steps, setSteps] = useState<
    Array<{ title: string; detail: string; path: string; status: StepStatus }>
  >([]);

  useEffect(() => {
    if (!eventId) {
      setSteps([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const teams = await fetchEventTeams(eventId).catch(() => []);
      const rounds = await fetchEventRounds(eventId).catch(() => []);
      const round = rounds[0];
      const boards = round ? await fetchRoundBoards(round.id).catch(() => []) : [];
      let hasProblem = false;
      if (boards[0]) {
        const problems = await fetchBoardProblems(boards[0].id).catch(() => []);
        hasProblem = problems.length > 0;
      }
      if (cancelled) return;
      setSteps([
        {
          title: "Thong tin co ban",
          detail: "Ten cuoc thi, quota va mo ta.",
          path: "/organizer/events/basic-info",
          status: "CONFIRMED"
        },
        {
          title: "Dang ky doi",
          detail: "Duyet doi va gui loi moi thanh vien.",
          path: "/organizer/registrations",
          status: teams.length > 0 ? "CONFIRMED" : "PENDING"
        },
        {
          title: "Bang thi",
          detail: "Tao bang va phan doi ngau nhien.",
          path: "/organizer/boards",
          status: boards.length > 0 ? "CONFIRMED" : "PENDING"
        },
        {
          title: "De thi",
          detail: "Cau hinh thoi gian mo de theo bang.",
          path: "/organizer/problems",
          status: hasProblem ? "CONFIRMED" : "PENDING"
        }
      ]);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return <ModuleSkeleton rows={4} />;
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tao cuoc thi"
        title="Quy trinh cau hinh"
        description="Trang thai tung buoc duoc tinh tu du lieu that tren he thong."
      />

      <section className="grid gap-md lg:grid-cols-2">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <div className="flex items-start justify-between gap-md">
              <div className="flex gap-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container font-label-md text-on-primary-container">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-headline-sm text-on-surface">{step.title}</h2>
                  <p className="mt-xs font-body-sm text-on-surface-variant">{step.detail}</p>
                </div>
              </div>
              <Badge tone={step.status === "CONFIRMED" ? "success" : "warning"}>
                {step.status === "CONFIRMED" ? "Da san sang" : "Can cau hinh"}
              </Badge>
            </div>
            <ButtonLink to={step.path} variant="secondary" className="mt-md" icon={<Icon name="arrow_forward" />}>
              Mo buoc nay
            </ButtonLink>
          </article>
        ))}
      </section>
    </div>
  );
}
