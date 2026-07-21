import { useEffect, useState } from "react";
import type { z } from "zod";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import {
  AuthAlert,
  AuthFieldLabel,
  AuthFormShell,
  authInputClassName
} from "../../components/auth/AuthFormShell";
import {
  StudentTypeFields,
  type StudentTypeValue
} from "../../components/auth/StudentTypeFields";
import { StaffProfileFields } from "../../components/auth/StaffProfileFields";
import { Button } from "../../components/ui/Button";
import {
  getAuthSession,
  getRoleHome,
  isAuthenticated,
  resolveRoleFromApiRoles,
  setAuthSession,
  type UserRole
} from "../../auth/authSession";
import { profileCompletionSchema, mentorJudgeProfileSchema, organizerProfileSchema } from "../../domain/schemas";
import { fetchMyProfile, updateMyProfile } from "../../services/profileService";
import { applyApiFormErrors } from "../../utils/apiError";
import { setStoredActiveEventId } from "../../hooks/useActiveEvent";
import { fetchPublicEvents } from "../../services/eventsApi";
import { fetchMyTeams } from "../../services/registrationService";
import { zodFieldErrors } from "../../utils/zodFieldErrors";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { consumeStaffInvitationReturn, isStaffInvitationActionPath, peekStaffInvitationReturn } from "../../utils/staffInvitationPaths";
import { isMentorOrJudgeApiRole, isStaffApiRole } from "../../utils/staffRoles";

async function resolveParticipantHome(): Promise<string> {
  try {
    const events = await fetchPublicEvents();
    for (const event of events) {
      const teams = await fetchMyTeams(event.id);
      if (teams.length > 0) {
        setStoredActiveEventId(event.id);
        return "/me";
      }
    }
  } catch {
    /* fallback */
  }
  return "/events";
}

async function resolveHome(role: UserRole): Promise<string> {
  if (role === "participant") {
    return resolveParticipantHome();
  }
  return getRoleHome(role);
}

export function CompleteProfilePage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromQuery = searchParams.get("from")?.trim() || "";
  const fromState = (location.state as { from?: string } | null)?.from?.trim() || "";
  const redirectTarget = fromQuery || fromState || peekStaffInvitationReturn() || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alreadyComplete, setAlreadyComplete] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [email, setEmail] = useState("");
  const [studentType, setStudentType] = useState<StudentTypeValue>("FPT");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [university, setUniversity] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [staffProfileFlow, setStaffProfileFlow] = useState(
    () => isStaffInvitationActionPath(redirectTarget)
  );
  const [mentorJudgeProfile, setMentorJudgeProfile] = useState(
    () => isStaffInvitationActionPath(redirectTarget)
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    let active = true;
    fetchMyProfile()
      .then((profile) => {
        if (!active) return;
        if (profile.profileCompleted !== false) {
          setAlreadyComplete(true);
          return;
        }
        setStaffProfileFlow(
          (current) =>
            current ||
            isStaffApiRole(profile.roles) ||
            isStaffInvitationActionPath(redirectTarget)
        );
        setMentorJudgeProfile(
          (current) =>
            current ||
            isMentorOrJudgeApiRole(profile.roles) ||
            isStaffInvitationActionPath(redirectTarget)
        );
        setEmail(profile.email ?? "");
        setStudentType(profile.studentType === "EXTERNAL" ? "EXTERNAL" : "FPT");
        setFullName(profile.fullName ?? "");
        setStudentId(profile.studentId ?? "");
        setUniversity(profile.university ?? "");
        setGithubUsername(profile.githubUsername ?? "");
      })
      .catch(() => {
        if (active) setAuthError("Không tải được hồ sơ. Thử đăng nhập lại.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [redirectTarget]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ message: "Vui lòng đăng nhập để hoàn tất hồ sơ." }} />;
  }

  if (loading) {
    return (
      <div className="w-full max-w-lg px-md">
        <ModuleSkeleton rows={6} />
      </div>
    );
  }

  if (alreadyComplete) {
    const role = getAuthSession().role;
    const target = redirectTarget || getRoleHome(role);
    return <Navigate to={target} replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAuthError(null);

    const parsed = staffProfileFlow
      ? mentorJudgeProfile
        ? mentorJudgeProfileSchema.safeParse({ fullName, githubUsername })
        : organizerProfileSchema.safeParse({ fullName })
      : profileCompletionSchema.safeParse({
          studentType,
          fullName,
          studentId,
          university: university || undefined,
          githubUsername
        });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setSaving(true);

    try {
      const updated = staffProfileFlow
        ? mentorJudgeProfile
          ? await updateMyProfile({
              fullName: (parsed.data as z.infer<typeof mentorJudgeProfileSchema>).fullName,
              githubUsername: (parsed.data as z.infer<typeof mentorJudgeProfileSchema>).githubUsername
            })
          : await updateMyProfile({
              fullName: (parsed.data as z.infer<typeof organizerProfileSchema>).fullName
            })
        : await updateMyProfile({
            ...(parsed.data as z.infer<typeof profileCompletionSchema>),
            university: (parsed.data as z.infer<typeof profileCompletionSchema>).university || undefined
          });
      const role: UserRole = resolveRoleFromApiRoles(updated.roles);
      setAuthSession({
        role,
        email: updated.email,
        name: updated.fullName || updated.email,
        profileCompleted: updated.profileCompleted !== false
      });

      if (updated.status === "PENDING_APPROVAL" && !isStaffInvitationActionPath(redirectTarget)) {
        window.location.href = "/login/pending-approval";
        return;
      }

      const target = redirectTarget || (await resolveHome(role));
      if (isStaffInvitationActionPath(target)) {
        consumeStaffInvitationReturn();
      }
      window.location.href = target;
    } catch (error) {
      applyApiFormErrors(error, setFieldErrors);
      setAuthError(error instanceof Error ? error.message : "Lưu hồ sơ thất bại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthFormShell
      title="Hoàn tất hồ sơ"
      subtitle={
        staffProfileFlow
          ? mentorJudgeProfile
            ? "Xác nhận họ tên và GitHub username để BTC cấp quyền xem repo đội."
            : "Xác nhận họ tên để tiếp tục (BTC không cần MSSV hay GitHub)."
          : "Bổ sung thông tin cá nhân để tiếp tục sử dụng hệ thống."
      }
    >
      {authError ? <AuthAlert tone="error">{authError}</AuthAlert> : null}

      <form className="flex flex-col gap-md" onSubmit={(e) => void handleSubmit(e)}>
        <AuthFieldLabel label="Email">
          <input
            type="email"
            className={authInputClassName("opacity-80")}
            value={email}
            disabled
            readOnly
          />
        </AuthFieldLabel>

        {staffProfileFlow ? (
          <StaffProfileFields
            fullName={fullName}
            onFullNameChange={setFullName}
            githubUsername={githubUsername}
            onGithubUsernameChange={setGithubUsername}
            requireGithub={mentorJudgeProfile}
            fieldErrors={fieldErrors}
            onClearError={(key) => setFieldErrors((prev) => ({ ...prev, [key]: "" }))}
            disabled={saving}
          />
        ) : (
          <StudentTypeFields
            studentType={studentType}
            onStudentTypeChange={setStudentType}
            fullName={fullName}
            onFullNameChange={setFullName}
            studentId={studentId}
            onStudentIdChange={setStudentId}
            university={university}
            onUniversityChange={setUniversity}
            githubUsername={githubUsername}
            onGithubUsernameChange={setGithubUsername}
            fieldErrors={fieldErrors}
            onClearError={(key) => setFieldErrors((prev) => ({ ...prev, [key]: "" }))}
            disabled={saving}
          />
        )}

        <Button type="submit" loading={saving} className="w-full justify-center">
          Lưu và tiếp tục
        </Button>
      </form>
    </AuthFormShell>
  );
}
