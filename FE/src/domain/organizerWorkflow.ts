export type WorkflowStepState = "done" | "active" | "next" | "blocked";

export interface OrganizerMacroStep {
  id: string;
  label: string;
  detail: string;
  path: string;
}

/** Luồng vận hành BTC (macro) — dùng trên nhiều trang. */
export const ORGANIZER_MACRO_STEPS: OrganizerMacroStep[] = [
  {
    id: "basic",
    label: "Thông tin",
    detail: "Tên, quota, mở đăng ký",
    path: "/organizer/events/basic-info"
  },
  {
    id: "teams-hub",
    label: "Đội & lời mời",
    detail: "Đăng ký, duyệt đội và theo dõi lời mời",
    path: "/organizer/teams-hub"
  },
  {
    id: "boards",
    label: "Bảng thi",
    detail: "Vòng, bảng, vị trí, gán đội",
    path: "/organizer/boards"
  },
  {
    id: "board-ops",
    label: "Vận hành bảng",
    detail: "Đề thi, mentor & giám khảo",
    path: "/organizer/board-ops"
  },
  {
    id: "artifacts-hub",
    label: "Bài nộp & repo",
    detail: "Theo dõi nộp bài và repository GitHub",
    path: "/organizer/artifacts-hub"
  },
  {
    id: "results-hub",
    label: "Kết quả",
    detail: "Chấm điểm, xếp hạng, công bố & chung kết",
    path: "/organizer/results-hub"
  }
];

