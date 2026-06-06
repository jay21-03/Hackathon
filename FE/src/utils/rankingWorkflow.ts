import type { WorkflowStep } from "../components/ui/WorkflowSteps";

export type RankingWorkflowPhase = "scoring" | "ranking" | "publish" | "export";

export function buildRankingWorkflowSteps(active: RankingWorkflowPhase): WorkflowStep[] {
  const order: RankingWorkflowPhase[] = ["scoring", "ranking", "publish", "export"];
  const activeIndex = order.indexOf(active);

  function stateFor(phase: RankingWorkflowPhase): WorkflowStep["state"] {
    const index = order.indexOf(phase);
    if (index < activeIndex) return "done";
    if (index === activeIndex) return "active";
    return "next";
  }

  return [
    {
      label: "Tiến độ chấm",
      detail: "Giám khảo nộp phiếu SUBMITTED.",
      to: "/organizer/scoring",
      state: stateFor("scoring")
    },
    {
      label: "Xếp hạng",
      detail: "Tính điểm TB theo bảng.",
      to: "/organizer/ranking",
      state: stateFor("ranking")
    },
    {
      label: "Công bố",
      detail: "Hiển thị kết quả cho thí sinh & khách.",
      to: "/organizer/publish-results",
      state: stateFor("publish")
    },
    {
      label: "Xuất CSV",
      detail: "Tải bảng xếp hạng.",
      to: "/organizer/export-success",
      state: stateFor("export")
    }
  ];
}
