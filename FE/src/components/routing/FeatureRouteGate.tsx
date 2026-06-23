import { Navigate } from "react-router-dom";

/** Chuyển hướng khi tính năng chưa bật — tránh trang «Chưa kết nối API» gây rối. */
export function FeatureRouteGate({
  enabled,
  redirectTo,
  message,
  children
}: {
  enabled: boolean;
  redirectTo: string;
  message?: string;
  children: React.ReactNode;
}) {
  if (!enabled) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          message:
            message ?? "Tính năng này chưa được bật trên môi trường hiện tại."
        }}
      />
    );
  }
  return children;
}
