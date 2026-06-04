import { Navigate } from "react-router-dom";

/** Đã gộp vào Đội của tôi — giữ route cho link cũ. */
export function TeamStatusPage() {
  return <Navigate to="/me/team" replace />;
}
