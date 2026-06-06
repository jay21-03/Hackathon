import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import {
  getRoleHome,
  isAuthenticated,
  resolveRoleFromApiRoles,
  setAuthSession
} from "../../auth/authSession";
import { fetchCurrentUser } from "../../services/userService";
import { useToast } from "../../components/feedback/ToastProvider";
import { ButtonLink } from "../../components/ui/Button";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  acceptStaffInvitation,
  declineStaffInvitation,
  type StaffInvitationResponse
} from "../../services/staffInvitationService";
import { getApiErrorMessage } from "../../utils/apiError";
import { decodeInvitationTokenParam } from "../../utils/invitationToken";

export type StaffInvitationAction = "accept" | "decline";

interface StaffInvitationActionPageProps {
  action: StaffInvitationAction;
}

export function StaffInvitationActionPage({ action }: StaffInvitationActionPageProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = decodeInvitationTokenParam(searchParams.get("token"));
  const { notify } = useToast();
  const startedRef = useRef(false);
  const [result, setResult] = useState<StaffInvitationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const returnTo = `${location.pathname}${location.search}`;
  const isAccept = action === "accept";

  useEffect(() => {
    if (!token) {
      setError("Thiếu mã lời mời trong liên kết.");
      setProcessing(false);
      return;
    }
    if (!isAuthenticated()) return;
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        if (isAccept) {
          const accepted = await acceptStaffInvitation(token);
          setResult(accepted);
          const me = await fetchCurrentUser();
          const role = resolveRoleFromApiRoles(me.roles);
          setAuthSession({ role, email: me.email, name: me.fullName });
          notify("Đã chấp nhận lời mời mentor/giám khảo.", "success");
        } else {
          await declineStaffInvitation(token);
          notify("Đã từ chối lời mời.", "success");
        }
      } catch (err) {
        setError(getApiErrorMessage(err, "Không xử lý được lời mời."));
      } finally {
        setProcessing(false);
      }
    })();
  }, [token, isAccept, notify]);

  if (!token) {
    return (
      <div className="mx-auto max-w-md space-y-md p-page">
        <p className="font-body-sm text-error">Liên kết lời mời không hợp lệ.</p>
        <ButtonLink to="/login">Đăng nhập</ButtonLink>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: returnTo }} />;
  }

  if (processing) return <ModuleSkeleton rows={3} />;

  const home =
    result?.role === "JUDGE"
      ? getRoleHome("judge")
      : result?.role === "MENTOR"
        ? getRoleHome("mentor")
        : getRoleHome("participant");

  return (
    <div className="mx-auto max-w-md space-y-lg p-page">
      <PageHeader
        eyebrow="Lời mời mentor / giám khảo"
        title={isAccept ? "Xác nhận tham gia" : "Từ chối lời mời"}
        description={
          result
            ? `Bạn đã được gán vào bảng ${result.boardName ?? result.boardId} (${result.role === "JUDGE" ? "Giám khảo" : "Mentor"}).`
            : error ?? (isAccept ? "Hoàn tất." : "Đã ghi nhận từ chối.")
        }
      />
      {error ? <p className="font-body-sm text-error">{error}</p> : null}
      {result ? (
        <div className="flex gap-md">
          <ButtonLink to={home}>Vào không gian làm việc</ButtonLink>
          <Link to="/events" className="font-label-sm text-primary hover:underline">
            Danh sách cuộc thi
          </Link>
        </div>
      ) : (
        <ButtonLink to="/events">Quay lại</ButtonLink>
      )}
    </div>
  );
}
