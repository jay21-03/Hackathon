import type { BadgeTone } from "../ui/Badge";
import type { MatrixTeamRowResponse } from "../../services/scoringApi";

export interface TeamScoreStatusInfo {
  label: string;
  description: string;
  tone: BadgeTone;
  icon: string;
}

function countScoredCriteria(team: MatrixTeamRowResponse, filledByCriteria?: Record<number, string>): number {
  if (filledByCriteria) {
    return Object.values(filledByCriteria).filter((value) => value !== "" && value != null).length;
  }
  return team.scores.filter((score) => score.scoreValue != null).length;
}

export function getTeamScoreStatus(
  team: MatrixTeamRowResponse,
  criteriaCount: number,
  filledByCriteria?: Record<number, string>
): TeamScoreStatusInfo {
  if (team.status === "SUBMITTED") {
    return {
      label: "Đã nộp phiếu chấm",
      description: "Phiếu đã nộp và đang khóa. Liên hệ BTC nếu cần mở lại để chỉnh sửa.",
      tone: "success",
      icon: "task_alt"
    };
  }

  if (!team.editable) {
    return {
      label: "Không thể chấm",
      description: "Đội không còn đủ điều kiện chấm (ví dụ bị loại) hoặc bảng đã khóa.",
      tone: "danger",
      icon: "lock"
    };
  }

  const scoredCount = countScoredCriteria(team, filledByCriteria);

  if (scoredCount === 0) {
    return {
      label: "Chưa chấm điểm",
      description: "Bạn chưa nhập điểm cho đội này. Mở phiếu chấm và nhập điểm theo tiêu chí.",
      tone: "neutral",
      icon: "edit_note"
    };
  }

  if (scoredCount < criteriaCount) {
    return {
      label: "Đang chấm dở",
      description: `Đã nhập ${scoredCount}/${criteriaCount} tiêu chí. Lưu nháp hoặc hoàn tất rồi nộp phiếu.`,
      tone: "warning",
      icon: "pending_actions"
    };
  }

  return {
    label: "Chưa nộp phiếu",
    description: "Đã nhập đủ điểm nhưng phiếu vẫn ở trạng thái nháp. Bấm Nộp phiếu để hoàn tất.",
    tone: "warning",
    icon: "upload"
  };
}
