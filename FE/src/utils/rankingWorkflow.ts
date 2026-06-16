import type { WorkflowStep } from "../components/ui/WorkflowSteps";

export type RankingWorkflowPhase = "rubric" | "scoring" | "ranking" | "publish" | "export";

export function buildRankingWorkflowSteps(active: RankingWorkflowPhase): WorkflowStep[] {
  const order: RankingWorkflowPhase[] = ["rubric", "scoring", "ranking", "publish", "export"];
  const activeIndex = order.indexOf(active);

  function stateFor(phase: RankingWorkflowPhase): WorkflowStep["state"] {
    const index = order.indexOf(phase);
    if (index < activeIndex) return "done";
    if (index === activeIndex) return "active";
    return "next";
  }

  return [
    {
      label: "Tiêu chí chấm",
      detail: "Cấu hình rubric cho vòng thi.",
      to: "/organizer/boards#board-step-rubric",
      state: stateFor("rubric")
    },
    {
      label: "Tiến độ chấm",
      detail: "Giám khảo nộp phiếu SUBMITTED.",
      to: "/organizer/results-hub#results-step-scoring",
      state: stateFor("scoring")
    },
    {
      label: "Xếp hạng",
      detail: "Tính điểm TB theo bảng.",
      to: "/organizer/results-hub#results-step-ranking",
      state: stateFor("ranking")
    },
    {
      label: "Công bố",
      detail: "Hiển thị kết quả cho thí sinh & khách.",
      to: "/organizer/results-hub#results-step-publish",
      state: stateFor("publish")
    },
    {
      label: "Xuất CSV",
      detail: "Tải bảng xếp hạng.",
      to: "/organizer/results-hub#results-step-export",
      state: stateFor("export")
    }
  ];
}
