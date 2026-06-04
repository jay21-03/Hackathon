import { Navigate } from "react-router-dom";

/** Chuyển hướng khi tính năng chưa bật — tránh trang «Chưa kết nối API» gây rối. */
export function FeatureRouteGate({
  enabled,
  redirectTo,
  children
}: {
  enabled: boolean;
  redirectTo: string;
  children: React.ReactNode;
}) {
  if (!enabled) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}
