import type { WorkflowStep } from "../components/ui/WorkflowSteps";

export type JudgeWorkflowPhase = "dashboard" | "scoring";

export function buildJudgeWorkflowSteps(active: JudgeWorkflowPhase, hasAssignments: boolean): WorkflowStep[] {
  return [
    {
      label: "Chọn bảng",
      detail: "Xem các bảng được phân công.",
      to: "/judge/dashboard",
      state: active === "dashboard" ? "active" : hasAssignments ? "done" : "next"
    },
    {
      label: "Chấm điểm",
      detail: "Điền ma trận và nộp phiếu SUBMITTED.",
      to: "/judge/scoring",
      state: active === "scoring" ? "active" : hasAssignments ? "next" : "blocked"
    }
  ];
}
