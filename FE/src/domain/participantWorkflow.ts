import type { WorkflowStep } from "../components/ui/WorkflowSteps";
import { enableRanking, enableSubmissions } from "../config/features";

export type ParticipantWorkflowPhase = "team" | "board" | "problem" | "submission" | "results";

export function buildParticipantWorkflowSteps(input: {
  active: ParticipantWorkflowPhase;
  isConfirmed: boolean;
  hasBoard: boolean;
  hasSubmitted?: boolean;
  resultsPublished?: boolean;
  teamStatus?: string | null;
}): WorkflowStep[] {
  const { active, isConfirmed, hasBoard, hasSubmitted, resultsPublished, teamStatus } = input;
  const blockedByStatus =
    teamStatus === "DISQUALIFIED" ||
    teamStatus === "REJECTED" ||
    teamStatus === "WAITLIST";
  const statusDetail =
    teamStatus === "WAITLIST"
      ? "Đội đang trong danh sách chờ — chờ BTC xác nhận."
      : teamStatus === "DISQUALIFIED"
        ? "Đội đã bị loại khỏi cuộc thi."
        : teamStatus === "REJECTED"
          ? "Hồ sơ đội đã bị từ chối."
          : undefined;

  const phases: ParticipantWorkflowPhase[] = ["team", "board", "problem"];
  if (enableSubmissions) phases.push("submission");
  if (enableRanking) phases.push("results");

  const activeIndex = phases.indexOf(active);

  function stateFor(phase: ParticipantWorkflowPhase): WorkflowStep["state"] {
    const index = phases.indexOf(phase);
    if (index < activeIndex) return "done";
    if (index === activeIndex) return "active";

    if (blockedByStatus && phase !== "team") return "blocked";
    if (phase === "board") return isConfirmed ? "next" : "blocked";
    if (phase === "problem") return isConfirmed && hasBoard ? "next" : "blocked";
    if (phase === "submission") return isConfirmed && hasBoard ? "next" : "blocked";
    if (phase === "results") {
      if (!isConfirmed || !hasBoard || blockedByStatus) return "blocked";
      return hasSubmitted || resultsPublished ? "next" : "blocked";
    }
    return "next";
  }

  const steps: WorkflowStep[] = [
    {
      label: "Đội thi",
      detail: statusDetail ?? "Thành viên và tiến độ xác nhận.",
      to: "/me/team",
      state: stateFor("team")
    },
    {
      label: "Bảng thi",
      detail: hasBoard ? "Đã được gán bảng." : "Chờ ban tổ chức gán bảng.",
      to: "/me/board",
      state: stateFor("board")
    },
    {
      label: "Đề thi",
      detail: "Mở theo lịch ban tổ chức cấu hình.",
      to: "/me/problem",
      state: stateFor("problem")
    }
  ];

  if (enableSubmissions) {
    steps.push({
      label: "Bài nộp",
      detail: hasSubmitted ? "Đã nộp repository." : "Nộp link repository trước hạn.",
      to: "/me/submission",
      state: stateFor("submission")
    });
  }

  if (enableRanking) {
    steps.push({
      label: "Kết quả",
      detail: resultsPublished ? "Kết quả đã công bố." : "Chờ ban tổ chức công bố.",
      to: "/me/results",
      state: stateFor("results")
    });
  }

  return steps;
}
