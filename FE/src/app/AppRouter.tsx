import { lazy, Suspense, type ComponentType, type ReactNode, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SESSION_CHANGE_EVENT } from "../auth/authSession";
import { RoleGuard } from "../components/auth/RoleGuard";
import { AuthLayout } from "../components/layout/AuthLayout";
import { PublicShell } from "../components/layout/PublicShell";
import { WorkspaceShell } from "../components/layout/WorkspaceShell";
import { ModuleSkeleton } from "../components/ui/ModuleSkeleton";
import {
  judgeNav,
  mentorNav,
  organizerNav,
  participantWorkspaceNav
} from "../config/navigation";

function lazyPage<T extends Record<string, unknown>, K extends keyof T>(
  loader: () => Promise<T>,
  key: K
) {
  return lazy(async () => {
    const module = await loader();
    return { default: module[key] as ComponentType<any> };
  });
}

const LoginPage = lazyPage(() => import("../pages/auth/LoginPage"), "LoginPage");
const EventDetailPage = lazyPage(() => import("../pages/events/EventDetailPage"), "EventDetailPage");
const EventsDiscoveryPage = lazyPage(() => import("../pages/events/EventsDiscoveryPage"), "EventsDiscoveryPage");
const ResultsPortalPage = lazyPage(() => import("../pages/public/ResultsPortalPage"), "ResultsPortalPage");
const InvitationStatusPage = lazyPage(() => import("../pages/public/InvitationStatusPage"), "InvitationStatusPage");
const TeamInvitationConfirmationPage = lazyPage(() => import("../pages/public/TeamInvitationConfirmationPage"), "TeamInvitationConfirmationPage");
const TeamInvitationActionPage = lazyPage(() => import("../pages/public/TeamInvitationActionPage"), "TeamInvitationActionPage");
const TeamInvitationLegacyRedirect = lazyPage(() => import("../pages/public/TeamInvitationLegacyRedirect"), "TeamInvitationLegacyRedirect");
const TeamRegistrationPage = lazyPage(() => import("../pages/public/TeamRegistrationPage"), "TeamRegistrationPage");
const JudgeDashboardPage = lazyPage(() => import("../pages/judge/JudgeDashboardPage"), "JudgeDashboardPage");
const JudgeScoringPage = lazyPage(() => import("../pages/judge/JudgeScoringPage"), "JudgeScoringPage");
const MentorAiReviewPage = lazyPage(() => import("../pages/mentor/MentorAiReviewPage"), "MentorAiReviewPage");
const MentorDashboardPage = lazyPage(() => import("../pages/mentor/MentorDashboardPage"), "MentorDashboardPage");
const AnnouncementPage = lazyPage(() => import("../pages/organizer/AnnouncementPage"), "AnnouncementPage");
const AiAuditorPage = lazyPage(() => import("../pages/organizer/AiAuditorPage"), "AiAuditorPage");
const AiInsightsPage = lazyPage(() => import("../pages/organizer/AiInsightsPage"), "AiInsightsPage");
const AssignmentManagementPage = lazyPage(() => import("../pages/organizer/AssignmentManagementPage"), "AssignmentManagementPage");
const BoardManagementPage = lazyPage(() => import("../pages/organizer/BoardManagementPage"), "BoardManagementPage");
const CheckInManagementPage = lazyPage(() => import("../pages/organizer/CheckInManagementPage"), "CheckInManagementPage");
const DisqualificationPage = lazyPage(() => import("../pages/organizer/DisqualificationPage"), "DisqualificationPage");
const EventBasicInfoPage = lazyPage(() => import("../pages/organizer/EventBasicInfoPage"), "EventBasicInfoPage");
const EventManagementPage = lazyPage(() => import("../pages/organizer/EventManagementPage"), "EventManagementPage");
const CreateEventPage = lazyPage(() => import("../pages/organizer/CreateEventPage"), "CreateEventPage");
const EventWizardPage = lazyPage(() => import("../pages/organizer/EventWizardPage"), "EventWizardPage");
const ExportSuccessPage = lazyPage(() => import("../pages/organizer/ExportSuccessPage"), "ExportSuccessPage");
const FinalsPage = lazyPage(() => import("../pages/organizer/FinalsPage"), "FinalsPage");
const InvitationManagementPage = lazyPage(() => import("../pages/organizer/InvitationManagementPage"), "InvitationManagementPage");
const NotificationCenterPage = lazyPage(() => import("../pages/organizer/NotificationCenterPage"), "NotificationCenterPage");
const OrganizerOverviewPage = lazyPage(() => import("../pages/organizer/OrganizerOverviewPage"), "OrganizerOverviewPage");
const ProblemManagementPage = lazyPage(() => import("../pages/organizer/ProblemManagementPage"), "ProblemManagementPage");
const PublishResultsPage = lazyPage(() => import("../pages/organizer/PublishResultsPage"), "PublishResultsPage");
const RankingPage = lazyPage(() => import("../pages/organizer/RankingPage"), "RankingPage");
const RegistrationManagementPage = lazyPage(() => import("../pages/organizer/RegistrationManagementPage"), "RegistrationManagementPage");
const RubricSetupPage = lazyPage(() => import("../pages/organizer/RubricSetupPage"), "RubricSetupPage");
const ScoringProgressPage = lazyPage(() => import("../pages/organizer/ScoringProgressPage"), "ScoringProgressPage");
const UserManagementPage = lazyPage(() => import("../pages/organizer/UserManagementPage"), "UserManagementPage");
const AiReviewPage = lazyPage(() => import("../pages/participant/AiReviewPage"), "AiReviewPage");
const AssignedBoardPage = lazyPage(() => import("../pages/participant/AssignedBoardPage"), "AssignedBoardPage");
const CheckInPage = lazyPage(() => import("../pages/participant/CheckInPage"), "CheckInPage");
const ParticipantOverviewPage = lazyPage(() => import("../pages/participant/ParticipantOverviewPage"), "ParticipantOverviewPage");
const ProfilePage = lazyPage(() => import("../pages/participant/ProfilePage"), "ProfilePage");
const ProblemPage = lazyPage(() => import("../pages/participant/ProblemPage"), "ProblemPage");
const SubmissionPage = lazyPage(() => import("../pages/participant/SubmissionPage"), "SubmissionPage");
const TeamOverviewPage = lazyPage(() => import("../pages/participant/TeamOverviewPage"), "TeamOverviewPage");
const TeamStatusPage = lazyPage(() => import("../pages/participant/TeamStatusPage"), "TeamStatusPage");

function routeElement(component: ReactNode) {
  return <Suspense fallback={<ModuleSkeleton rows={4} />}>{component}</Suspense>;
}

export function AppRouter() {
  const location = useLocation();

  useEffect(() => {
    // notify listeners that demo session may have changed on navigation
    try {
      window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
    } catch {
      /* ignore */
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<AuthLayout />}>
        <Route index element={routeElement(<LoginPage />)} />
      </Route>

      <Route path="/" element={<Navigate to="/events" replace />} />

      <Route element={<PublicShell />}>
        <Route path="events" element={routeElement(<EventsDiscoveryPage />)} />
      </Route>

      <Route element={<RoleGuard allow={["participant", "organizer", "mentor", "judge"]} />}>
        <Route element={<PublicShell />}>
          <Route path="events/:eventId" element={routeElement(<EventDetailPage />)} />
          <Route path="events/:eventId/results" element={routeElement(<ResultsPortalPage />)} />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={["participant", "organizer", "mentor", "judge"]} />}>
        <Route element={<PublicShell />}>
          <Route
            path="team-invitations/accept"
            element={routeElement(<TeamInvitationActionPage action="accept" />)}
          />
          <Route
            path="team-invitations/decline"
            element={routeElement(<TeamInvitationActionPage action="decline" />)}
          />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={["participant"]} />}>
        <Route element={<PublicShell />}>
          <Route path="register" element={routeElement(<TeamRegistrationPage />)} />
          <Route path="team-invitation" element={routeElement(<TeamInvitationLegacyRedirect />)} />
          <Route
            path="team-invitation/manual"
            element={routeElement(<TeamInvitationConfirmationPage />)}
          />
          <Route path="team-invitations/status" element={routeElement(<InvitationStatusPage />)} />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={["participant"]} />}>
        <Route
          path="/me"
          element={
            <WorkspaceShell
              navItems={participantWorkspaceNav}
              title="Khu vực thí sinh"
              subtitle="Theo dõi đội thi"
              primaryAction={{ label: "Đăng ký đội", icon: "group_add", to: "/register" }}
            />
          }
        >
          <Route index element={routeElement(<ParticipantOverviewPage />)} />
          <Route path="team" element={routeElement(<TeamOverviewPage />)} />
          <Route path="status" element={routeElement(<TeamStatusPage />)} />
          <Route path="board" element={routeElement(<AssignedBoardPage />)} />
          <Route path="profile" element={routeElement(<ProfilePage />)} />
          <Route path="check-in" element={routeElement(<CheckInPage />)} />
          <Route path="problem" element={routeElement(<ProblemPage />)} />
          <Route path="countdown" element={routeElement(<ProblemPage />)} />
          <Route path="submission" element={routeElement(<SubmissionPage />)} />
          <Route path="ai-review" element={routeElement(<AiReviewPage />)} />
          <Route path="results" element={routeElement(<ResultsPortalPage participantView />)} />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={["organizer"]} />}>
        <Route
          path="/organizer"
          element={
            <WorkspaceShell
              navItems={organizerNav}
              title="Ban tổ chức"
              subtitle="Quản lý cuộc thi"
              primaryAction={{ label: "Công bố kết quả", icon: "campaign", to: "/organizer/publish-results" }}
            />
          }
        >
          <Route path="dashboard" element={routeElement(<OrganizerOverviewPage />)} />
          <Route path="events" element={routeElement(<EventManagementPage />)} />
          <Route path="events/new" element={routeElement(<CreateEventPage />)} />
          <Route path="events/wizard" element={routeElement(<EventWizardPage />)} />
          <Route path="events/basic-info" element={routeElement(<EventBasicInfoPage />)} />
          <Route path="registrations" element={routeElement(<RegistrationManagementPage />)} />
          <Route path="users" element={routeElement(<UserManagementPage />)} />
          <Route path="problems" element={routeElement(<ProblemManagementPage />)} />
          <Route path="rubric" element={routeElement(<RubricSetupPage />)} />
          <Route path="boards" element={routeElement(<BoardManagementPage />)} />
          <Route path="assignments" element={routeElement(<AssignmentManagementPage />)} />
          <Route path="invitations" element={routeElement(<InvitationManagementPage />)} />
          <Route path="check-ins" element={routeElement(<CheckInManagementPage />)} />
          <Route path="scoring" element={routeElement(<ScoringProgressPage />)} />
          <Route path="ranking" element={routeElement(<RankingPage />)} />
          <Route path="finals" element={routeElement(<FinalsPage />)} />
          <Route path="disqualifications" element={routeElement(<DisqualificationPage />)} />
          <Route path="ai-auditor" element={routeElement(<AiAuditorPage />)} />
          <Route path="ai-insights" element={routeElement(<AiInsightsPage />)} />
          <Route path="announcements" element={routeElement(<AnnouncementPage />)} />
          <Route path="notifications" element={routeElement(<NotificationCenterPage />)} />
          <Route path="publish-results" element={routeElement(<PublishResultsPage />)} />
          <Route path="export-success" element={routeElement(<ExportSuccessPage />)} />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={["judge"]} />}>
        <Route
          path="/judge"
          element={<WorkspaceShell navItems={judgeNav} title="Giám khảo" subtitle="Chấm điểm theo rubric" />}
        >
          <Route path="dashboard" element={routeElement(<JudgeDashboardPage />)} />
          <Route path="scoring" element={routeElement(<JudgeScoringPage />)} />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={["mentor"]} />}>
        <Route
          path="/mentor"
          element={<WorkspaceShell navItems={mentorNav} title="Mentor" subtitle="Theo dõi đội phụ trách" />}
        >
          <Route path="dashboard" element={routeElement(<MentorDashboardPage />)} />
          <Route path="ai-review" element={routeElement(<MentorAiReviewPage />)} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/events" replace />} />
    </Routes>
  );
}
