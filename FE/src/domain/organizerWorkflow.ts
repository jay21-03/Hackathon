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
    id: "registrations",
    label: "Đăng ký đội",
    detail: "Duyệt đội và danh sách chờ",
    path: "/organizer/registrations"
  },
  {
    id: "invitations",
    label: "Lời mời",
    detail: "Theo dõi thư mời thành viên",
    path: "/organizer/invitations"
  },
  {
    id: "boards",
    label: "Bảng thi",
    detail: "Vòng, bảng, slot, gán đội",
    path: "/organizer/boards"
  },
  {
    id: "problems",
    label: "Đề thi",
    detail: "Mở đề theo bảng",
    path: "/organizer/problems"
  },
  {
    id: "assignments",
    label: "Phân công",
    detail: "Mentor & giám khảo",
    path: "/organizer/assignments"
  }
];

export function macroStepState(
  stepId: string,
  currentPageId: string,
  completedThroughIndex: number
): WorkflowStepState {
  const index = ORGANIZER_MACRO_STEPS.findIndex((s) => s.id === stepId);
  const currentIndex = ORGANIZER_MACRO_STEPS.findIndex((s) => s.id === currentPageId);
  if (index < 0) return "next";
  if (index <= completedThroughIndex) return "done";
  if (index === currentIndex) return "active";
  if (index === currentIndex + 1) return "next";
  return "blocked";
}
