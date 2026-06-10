import { Navigate } from "react-router-dom";

/** @deprecated Dùng hub Vận hành bảng — giữ route để tương thích link cũ. */
export function AssignmentManagementPage() {
  return <Navigate to="/organizer/board-ops#ops-step-mentor" replace />;
}
