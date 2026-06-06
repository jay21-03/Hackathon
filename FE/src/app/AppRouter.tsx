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
import { enableAnnouncements, enableNotifications, enablePhase7, enableRanking, enableScoring, enableSubmissions } from "../config/features";
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
const EventDetailPage = lazyPage(() => import("../pages/events/EventDetailPage"), "EventDetailPage");
const EventsDiscoveryPage = lazyPage(() => import("../pages/events/EventsDiscoveryPage"), "EventsDiscoveryPage");
const ResultsPortalPage = lazyPage(() => import("../pages/public/ResultsPortalPage"), "ResultsPortalPage");
const InvitationStatusPage = lazyPage(() => import("../pages/public/InvitationStatusPage"), "InvitationStatusPage");
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
const SubmissionManagementPage = lazyPage(
  () => import("../pages/organizer/SubmissionManagementPage"),
  "SubmissionManagementPage"
);
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
      </Route>

      <Route path="/" element={<Navigate to="/events" replace />} />

      {/* Trang chủ + trang công khai: thí sinh → ParticipantShell, khách → PublicShell */}
      <Route element={<ParticipantAwareShell />}>
        <Route path="events" element={routeElement(<EventsDiscoveryPage />)} />
        <Route
          path="events/:eventId/results"
          element={gatedRankingRoute("/events", <ResultsPortalPage />)}
        />
      </Route>

      <Route element={<RoleGuard allow={["participant", "organizer", "mentor", "judge"]} />}>
        <Route element={<ParticipantAwareShell />}>
          <Route path="events/:eventId" element={routeElement(<EventDetailPage />)} />
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
          <Route path="team-invitations/status" element={routeElement(<InvitationStatusPage />)} />
          <Route path="profile" element={routeElement(<ProfilePage />)} />
          <Route path="me" element={<ParticipantEventGate />}>
            <Route index element={routeElement(<ParticipantOverviewPage />)} />
            <Route path="team" element={routeElement(<TeamOverviewPage />)} />
            <Route path="status" element={routeElement(<TeamStatusPage />)} />
            <Route path="board" element={routeElement(<AssignedBoardPage />)} />
            <Route path="profile" element={<Navigate to="/profile" replace />} />
            <Route path="check-in" element={gatedRoute("/me", <CheckInPage />)} />
            <Route path="problem" element={routeElement(<ProblemPage />)} />
            <Route path="countdown" element={routeElement(<ProblemPage />)} />
            <Route path="submission" element={gatedSubmissionRoute("/me", <SubmissionPage />)} />
            <Route path="ai-review" element={gatedRoute("/me", <AiReviewPage />)} />
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
          <Route path="events" element={routeElement(<EventManagementPage />)} />
          <Route path="events/new" element={routeElement(<CreateEventPage />)} />
          <Route path="events/wizard" element={routeElement(<EventWizardPage />)} />
          <Route path="events/basic-info" element={routeElement(<EventBasicInfoPage />)} />
          <Route path="registrations" element={routeElement(<RegistrationManagementPage />)} />
          <Route path="users" element={routeElement(<UserManagementPage />)} />
          <Route path="problems" element={routeElement(<ProblemManagementPage />)} />
          <Route path="boards" element={routeElement(<BoardManagementPage />)} />
          <Route path="assignments" element={routeElement(<AssignmentManagementPage />)} />
          <Route path="invitations" element={routeElement(<InvitationManagementPage />)} />
          <Route path="rubric" element={gatedScoringRoute("/organizer/dashboard", <RubricSetupPage />)} />
          <Route path="check-ins" element={gatedRoute("/organizer/dashboard", <CheckInManagementPage />)} />
          <Route path="scoring" element={gatedScoringRoute("/organizer/dashboard", <ScoringProgressPage />)} />
          <Route
            path="submissions"
            element={gatedSubmissionRoute("/organizer/dashboard", <SubmissionManagementPage />)}
          />
          <Route path="ranking" element={gatedRankingRoute("/organizer/dashboard", <RankingPage />)} />
          <Route path="finals" element={gatedRoute("/organizer/dashboard", <FinalsPage />)} />
          <Route
            path="disqualifications"
            element={gatedRoute("/organizer/dashboard", <DisqualificationPage />)}
          />
          <Route path="ai-auditor" element={gatedRoute("/organizer/dashboard", <AiAuditorPage />)} />
          <Route path="ai-insights" element={gatedRoute("/organizer/dashboard", <AiInsightsPage />)} />
          <Route path="announcements" element={gatedAnnouncementRoute("/organizer/dashboard", <AnnouncementPage />)} />
          <Route
            path="notifications"
            element={gatedNotificationRoute("/organizer/dashboard", <NotificationCenterPage />)}
          />
          <Route
            path="publish-results"
            element={gatedRankingRoute("/organizer/dashboard", <PublishResultsPage />)}
          />
          <Route
            path="export-success"
            element={gatedRankingRoute("/organizer/dashboard", <ExportSuccessPage />)}
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
        </Route>
      </Route>

      <Route element={<RoleGuard allow={["mentor"]} />}>
        <Route
          path="/mentor"
          element={<WorkspaceShell navItems={mentorNav} title="Mentor" subtitle="Theo dõi đội phụ trách" />}
        >
          <Route path="dashboard" element={routeElement(<MentorDashboardPage />)} />
          <Route path="ai-review" element={gatedRoute("/mentor/dashboard", <MentorAiReviewPage />)} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/events" replace />} />
    </Routes>
  );
}
