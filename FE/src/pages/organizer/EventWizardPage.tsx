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
          title: "Thông tin cơ bản",
          detail: "Tên cuộc thi, quota va mo ta.",
          path: "/organizer/events/basic-info",
          status: "CONFIRMED"
        },
        {
          title: "Đăng ký đội",
          detail: "Duyệt đội và gửi lời mời thành viên.",
          path: "/organizer/registrations",
          status: teams.length > 0 ? "CONFIRMED" : "PENDING"
        },
        {
          title: "Bảng thi",
          detail: "Tạo bảng và phân đội ngẫu nhiên.",
          path: "/organizer/boards",
          status: boards.length > 0 ? "CONFIRMED" : "PENDING"
        },
        {
          title: "Đề thi",
          detail: "Cấu hình thời gian mở đề theo bảng.",
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
        eyebrow="Tạo cuộc thi"
        title="Quy trình cấu hình"
        description="Trạng thái từng bước được tính từ dữ liệu thật trên hệ thống."
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
                {step.status === "CONFIRMED" ? "Đã sẵn sàng" : "Cần cấu hình"}
              </Badge>
            </div>
            <ButtonLink to={step.path} variant="secondary" className="mt-md" icon={<Icon name="arrow_forward" />}>
              Mở bước này
            </ButtonLink>
          </article>
        ))}
      </section>
    </div>
  );
}
