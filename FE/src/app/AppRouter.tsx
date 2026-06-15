import { lazy, Suspense, type ComponentType, type ReactNode, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SESSION_CHANGE_EVENT } from "../auth/authSession";
import { RoleGuard } from "../components/auth/RoleGuard";
import { ParticipantEventGate } from "../components/participant/ParticipantEventGate";
import { OrganizerApiGate } from "../components/auth/OrganizerApiGate";
import { AuthLayout } from "../components/layout/AuthLayout";
import { ParticipantAwareShell, ParticipantShell } from "../components/layout/ParticipantShell";
import { PublicShell } from "../components/layout/PublicShell";
import { WorkspaceShell } from "../components/layout/WorkspaceShell";
import { ModuleSkeleton } from "../components/ui/ModuleSkeleton";
import { FeatureRouteGate } from "../components/routing/FeatureRouteGate";
import {
  enableAcademicTerms,
  enableAnnouncements,
  enableGithubProvisioning,
  enableAiReview,
  enableNotifications,
  enablePhase7,
  enableRanking,
  enableScoring,
  enableSubmissions
} from "../config/features";
import {
  judgeNav,
  mentorNav,
  organizerNav
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
const SignupPage = lazyPage(() => import("../pages/auth/SignupPage"), "SignupPage");
const ForgotPasswordPage = lazyPage(
  () => import("../pages/auth/ForgotPasswordPage"),
  "ForgotPasswordPage"
);
const ResetPasswordPage = lazyPage(
  () => import("../pages/auth/ResetPasswordPage"),
  "ResetPasswordPage"
);
const CompleteProfilePage = lazyPage(
  () => import("../pages/auth/CompleteProfilePage"),
  "CompleteProfilePage"
);
const PendingApprovalPage = lazyPage(
  () => import("../pages/auth/PendingApprovalPage"),
  "PendingApprovalPage"
);
const EventDetailPage = lazyPage(() => import("../pages/events/EventDetailPage"), "EventDetailPage");
const EventsDiscoveryPage = lazyPage(() => import("../pages/events/EventsDiscoveryPage"), "EventsDiscoveryPage");
const ResultsPortalPage = lazyPage(() => import("../pages/public/ResultsPortalPage"), "ResultsPortalPage");
const TeamInvitationConfirmationPage = lazyPage(() => import("../pages/public/TeamInvitationConfirmationPage"), "TeamInvitationConfirmationPage");
const TeamInvitationActionPage = lazyPage(() => import("../pages/public/TeamInvitationActionPage"), "TeamInvitationActionPage");
const StaffInvitationActionPage = lazyPage(
  () => import("../pages/public/StaffInvitationActionPage"),
  "StaffInvitationActionPage"
);
const TeamInvitationLegacyRedirect = lazyPage(() => import("../pages/public/TeamInvitationLegacyRedirect"), "TeamInvitationLegacyRedirect");
const TeamRegistrationPage = lazyPage(() => import("../pages/public/TeamRegistrationPage"), "TeamRegistrationPage");
const JudgeDashboardPage = lazyPage(() => import("../pages/judge/JudgeDashboardPage"), "JudgeDashboardPage");
const JudgeScoringPage = lazyPage(() => import("../pages/judge/JudgeScoringPage"), "JudgeScoringPage");
const JudgeNotificationsPage = lazyPage(
  () => import("../pages/judge/JudgeNotificationsPage"),
  "JudgeNotificationsPage"
);
const JudgeAiReviewPage = lazyPage(
  () => import("../pages/judge/JudgeAiReviewPage"),
  "JudgeAiReviewPage"
);
const MentorDashboardPage = lazyPage(() => import("../pages/mentor/MentorDashboardPage"), "MentorDashboardPage");
const MentorAiReviewPage = lazyPage(
  () => import("../pages/mentor/MentorAiReviewPage"),
  "MentorAiReviewPage"
);
const AnnouncementPage = lazyPage(() => import("../pages/organizer/AnnouncementPage"), "AnnouncementPage");
const AssignmentManagementPage = lazyPage(() => import("../pages/organizer/AssignmentManagementPage"), "AssignmentManagementPage");
const BoardManagementPage = lazyPage(() => import("../pages/organizer/BoardManagementPage"), "BoardManagementPage");
const BoardOperationsPage = lazyPage(() => import("../pages/organizer/BoardOperationsPage"), "BoardOperationsPage");
const ResultsHubPage = lazyPage(() => import("../pages/organizer/ResultsHubPage"), "ResultsHubPage");
const TeamsHubPage = lazyPage(() => import("../pages/organizer/TeamsHubPage"), "TeamsHubPage");
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
const SubmissionManagementPage = lazyPage(
  () => import("../pages/organizer/SubmissionManagementPage"),
  "SubmissionManagementPage"
);
const UserManagementPage = lazyPage(() => import("../pages/organizer/UserManagementPage"), "UserManagementPage");
const RepositoryManagementPage = lazyPage(
  () => import("../pages/organizer/RepositoryManagementPage"),
  "RepositoryManagementPage"
);
const ArtifactsHubPage = lazyPage(
  () => import("../pages/organizer/ArtifactsHubPage"),
  "ArtifactsHubPage"
);
const AcademicTermManagementPage = lazyPage(
  () => import("../pages/organizer/AcademicTermManagementPage"),
  "AcademicTermManagementPage"
);
const AssignedBoardPage = lazyPage(() => import("../pages/participant/AssignedBoardPage"), "AssignedBoardPage");
const ParticipantOverviewPage = lazyPage(() => import("../pages/participant/ParticipantOverviewPage"), "ParticipantOverviewPage");
const ProfilePage = lazyPage(() => import("../pages/participant/ProfilePage"), "ProfilePage");
const ProblemPage = lazyPage(() => import("../pages/participant/ProblemPage"), "ProblemPage");
const SubmissionPage = lazyPage(() => import("../pages/participant/SubmissionPage"), "SubmissionPage");
const ParticipantAiReviewPage = lazyPage(
  () => import("../pages/participant/ParticipantAiReviewPage"),
  "ParticipantAiReviewPage"
);
const TeamOverviewPage = lazyPage(() => import("../pages/participant/TeamOverviewPage"), "TeamOverviewPage");
const NotificationsPage = lazyPage(
  () => import("../pages/participant/NotificationsPage"),
  "NotificationsPage"
);

function routeElement(component: ReactNode) {
  return <Suspense fallback={<ModuleSkeleton rows={4} />}>{component}</Suspense>;
}

/** Phase 7+ tắt → redirect, không hiện FeatureUnavailable */
function gatedRoute(redirectTo: string, component: ReactNode) {
  return routeElement(
    <FeatureRouteGate enabled={enablePhase7} redirectTo={redirectTo}>
      {component}
    </FeatureRouteGate>
  );
}

/** Scoring (rubric, ma trận, tiến độ) — tách khỏi phase 7 khác */
function gatedScoringRoute(redirectTo: string, component: ReactNode) {
  return routeElement(
    <FeatureRouteGate enabled={enableScoring} redirectTo={redirectTo}>
      {component}
    </FeatureRouteGate>
  );
}

function gatedSubmissionRoute(redirectTo: string, component: ReactNode) {
  return routeElement(
    <FeatureRouteGate enabled={enableSubmissions} redirectTo={redirectTo}>
      {component}
    </FeatureRouteGate>
  );
}

function gatedGithubRoute(redirectTo: string, component: ReactNode) {
  return routeElement(
    <FeatureRouteGate enabled={enableGithubProvisioning} redirectTo={redirectTo}>
      {component}
    </FeatureRouteGate>
  );
}

function gatedArtifactsHubRoute(redirectTo: string, component: ReactNode) {
  return routeElement(
    <FeatureRouteGate
      enabled={enableSubmissions || enableGithubProvisioning}
      redirectTo={redirectTo}
    >
      {component}
    </FeatureRouteGate>
  );
}

function gatedAiReviewRoute(redirectTo: string, component: ReactNode) {
  return routeElement(
    <FeatureRouteGate enabled={enableAiReview} redirectTo={redirectTo}>
      {component}
    </FeatureRouteGate>
  );
}

/** Xếp hạng, công bố, xuất CSV, cổng kết quả công khai */
function gatedRankingRoute(redirectTo: string, component: ReactNode) {
  return routeElement(
    <FeatureRouteGate enabled={enableRanking} redirectTo={redirectTo}>
      {component}
    </FeatureRouteGate>
  );
}

function gatedNotificationRoute(redirectTo: string, component: ReactNode) {
  return routeElement(
    <FeatureRouteGate enabled={enableNotifications} redirectTo={redirectTo}>
      {component}
    </FeatureRouteGate>
  );
}

function gatedAnnouncementRoute(redirectTo: string, component: ReactNode) {
  return routeElement(
    <FeatureRouteGate enabled={enableAnnouncements} redirectTo={redirectTo}>
      {component}
    </FeatureRouteGate>
  );
}

export function AppRouter() {
  const location = useLocation();

  useEffect(() => {
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
        <Route path="signup" element={routeElement(<SignupPage />)} />
        <Route path="forgot-password" element={routeElement(<ForgotPasswordPage />)} />
        <Route path="reset-password" element={routeElement(<ResetPasswordPage />)} />
        <Route path="complete-profile" element={routeElement(<CompleteProfilePage />)} />
        <Route path="pending-approval" element={routeElement(<PendingApprovalPage />)} />
      </Route>

      <Route path="/" element={<Navigate to="/events" replace />} />

      {/* Trang chủ + trang công khai: thí sinh → ParticipantShell, khách → PublicShell */}
      <Route element={<ParticipantAwareShell />}>
        <Route path="events" element={routeElement(<EventsDiscoveryPage />)} />
        <Route
          path="events/:eventId/results"
          element={gatedRankingRoute("/events", <ResultsPortalPage />)}
        />
        <Route path="events/:eventId" element={routeElement(<EventDetailPage />)} />
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
          <Route
            path="staff-invitations/accept"
            element={routeElement(<StaffInvitationActionPage action="accept" />)}
          />
          <Route
            path="staff-invitations/decline"
            element={routeElement(<StaffInvitationActionPage action="decline" />)}
          />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={["participant"]} />}>
        <Route element={<ParticipantShell />}>
          <Route path="register" element={<Navigate to="/events" replace />} />
          <Route path="events/:eventId/register" element={routeElement(<TeamRegistrationPage />)} />
          <Route path="team-invitation" element={routeElement(<TeamInvitationLegacyRedirect />)} />
          <Route
            path="team-invitation/manual"
            element={routeElement(<TeamInvitationConfirmationPage />)}
          />
          <Route path="team-invitations/status" element={<Navigate to="/me/team" replace />} />
          <Route path="profile" element={routeElement(<ProfilePage />)} />
          <Route path="me" element={<ParticipantEventGate />}>
            <Route index element={routeElement(<ParticipantOverviewPage />)} />
            <Route path="team" element={routeElement(<TeamOverviewPage />)} />
            <Route path="status" element={<Navigate to="/me/team" replace />} />
            <Route path="board" element={routeElement(<AssignedBoardPage />)} />
            <Route path="profile" element={<Navigate to="/profile" replace />} />
            <Route path="problem" element={routeElement(<ProblemPage />)} />
            <Route path="countdown" element={<Navigate to="/me/problem" replace />} />
            <Route path="submission" element={gatedSubmissionRoute("/me", <SubmissionPage />)} />
            <Route path="ai-review" element={gatedAiReviewRoute("/me", <ParticipantAiReviewPage />)} />
            <Route
              path="results"
              element={gatedRankingRoute("/me", <ResultsPortalPage participantView />)}
            />
            <Route path="notifications" element={gatedNotificationRoute("/me", <NotificationsPage />)} />
          </Route>
        </Route>
      </Route>

      <Route element={<RoleGuard allow={["organizer"]} />}>
        <Route element={<OrganizerApiGate />}>
        <Route
          path="/organizer"
          element={
            <WorkspaceShell
              navItems={organizerNav}
              title="Ban tổ chức"
              subtitle="Vận hành theo cuộc thi"
              showActiveEventSubtitle
              primaryAction={{ label: "Danh sách cuộc thi", icon: "event", to: "/organizer/events" }}
            />
          }
        >
          <Route path="dashboard" element={routeElement(<OrganizerOverviewPage />)} />
          <Route
            path="academic-terms"
            element={
              enableAcademicTerms ? (
                routeElement(<AcademicTermManagementPage />)
              ) : (
                <Navigate to="/organizer/dashboard" replace />
              )
            }
          />
          <Route path="events" element={routeElement(<EventManagementPage />)} />
          <Route path="events/new" element={routeElement(<CreateEventPage />)} />
          <Route path="events/wizard" element={routeElement(<EventWizardPage />)} />
          <Route path="events/basic-info" element={routeElement(<EventBasicInfoPage />)} />
          <Route path="teams-hub" element={routeElement(<TeamsHubPage />)} />
          <Route
            path="registrations"
            element={<Navigate to="/organizer/teams-hub#teams-step-registrations" replace />}
          />
          <Route path="users" element={routeElement(<UserManagementPage />)} />
          <Route path="board-ops" element={routeElement(<BoardOperationsPage />)} />
          <Route path="problems" element={routeElement(<ProblemManagementPage />)} />
          <Route
            path="artifacts-hub"
            element={gatedArtifactsHubRoute("/organizer/dashboard", <ArtifactsHubPage />)}
          />
          <Route
            path="repositories"
            element={<Navigate to="/organizer/artifacts-hub#artifacts-step-repositories" replace />}
          />
          <Route path="boards" element={routeElement(<BoardManagementPage />)} />
          <Route path="assignments" element={routeElement(<AssignmentManagementPage />)} />
          <Route
            path="invitations"
            element={<Navigate to="/organizer/teams-hub#teams-step-invitations-members" replace />}
          />
          <Route
            path="results-hub"
            element={gatedScoringRoute("/organizer/dashboard", <ResultsHubPage />)}
          />
          <Route
            path="rubric"
            element={<Navigate to="/organizer/artifacts-hub#artifacts-step-rubric" replace />}
          />
          <Route
            path="scoring"
            element={<Navigate to="/organizer/results-hub#results-step-scoring" replace />}
          />
          <Route
            path="submissions"
            element={<Navigate to="/organizer/artifacts-hub#artifacts-step-submissions" replace />}
          />
          <Route
            path="ranking"
            element={<Navigate to="/organizer/results-hub#results-step-ranking" replace />}
          />
          <Route
            path="finals"
            element={<Navigate to="/organizer/results-hub#results-step-finals" replace />}
          />
          <Route
            path="awards"
            element={<Navigate to="/organizer/results-hub#results-step-awards" replace />}
          />
          <Route path="disqualifications" element={<Navigate to="/organizer/teams-hub#teams-step-registrations" replace />} />
          <Route path="announcements" element={gatedAnnouncementRoute("/organizer/dashboard", <AnnouncementPage />)} />
          <Route
            path="notifications"
            element={gatedNotificationRoute("/organizer/dashboard", <NotificationCenterPage />)}
          />
          <Route
            path="publish-results"
            element={<Navigate to="/organizer/results-hub#results-step-publish" replace />}
          />
          <Route
            path="export-success"
            element={<Navigate to="/organizer/results-hub#results-step-export" replace />}
          />
        </Route>
        </Route>
      </Route>

      <Route element={<RoleGuard allow={["judge"]} />}>
        <Route
          path="/judge"
          element={<WorkspaceShell navItems={judgeNav} title="Giám khảo" subtitle="Chấm điểm theo tiêu chí" />}
        >
          <Route path="dashboard" element={routeElement(<JudgeDashboardPage />)} />
          <Route path="scoring" element={gatedScoringRoute("/judge/dashboard", <JudgeScoringPage />)} />
          <Route path="ai-review" element={gatedAiReviewRoute("/judge/dashboard", <JudgeAiReviewPage />)} />
          <Route
            path="notifications"
            element={gatedNotificationRoute("/judge/dashboard", <JudgeNotificationsPage />)}
          />
          <Route path="profile" element={routeElement(<ProfilePage />)} />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={["mentor"]} />}>
        <Route
          path="/mentor"
          element={<WorkspaceShell navItems={mentorNav} title="Mentor" subtitle="Theo dõi đội phụ trách" />}
        >
          <Route path="dashboard" element={routeElement(<MentorDashboardPage />)} />
          <Route path="ai-review" element={gatedAiReviewRoute("/mentor/dashboard", <MentorAiReviewPage />)} />
          <Route path="profile" element={routeElement(<ProfilePage />)} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/events" replace />} />
    </Routes>
  );
}
