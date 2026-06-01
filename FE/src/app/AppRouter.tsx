import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { CommandShell } from "../components/layout/CommandShell";
import { MobileDiscoveryShell } from "../components/layout/MobileDiscoveryShell";
import {
  judgeNav,
  mentorNav,
  organizerNav,
  participantCommandNav
} from "../config/navigation";
import { LoginPage } from "../pages/auth/LoginPage";
import { EventDetailPage } from "../pages/events/EventDetailPage";
import { EventsDiscoveryPage } from "../pages/events/EventsDiscoveryPage";
import { OrganizerDashboardPage } from "../pages/organizer/OrganizerDashboardPage";
import { MyTeamPage } from "../pages/participant/MyTeamPage";
import { ParticipantDashboardPage } from "../pages/participant/ParticipantDashboardPage";

function PlaceholderPage({ title }: { title: string }) {
  return <div>{title}</div>;
}

const participantPlaceholders = [
  { path: "profile", title: "/me/profile" },
  { path: "check-in", title: "/me/check-in" },
  { path: "problem", title: "/me/problem" },
  { path: "countdown", title: "/me/countdown" },
  { path: "results", title: "/me/results" }
];

const organizerPlaceholders = [
  { path: "events", title: "/organizer/events" },
  { path: "boards", title: "/organizer/boards" },
  { path: "check-ins", title: "/organizer/check-ins" },
  { path: "scoring", title: "/organizer/scoring" },
  { path: "ranking", title: "/organizer/ranking" }
];

const judgePlaceholders = [
  { path: "dashboard", title: "/judge/dashboard" },
  { path: "scoring", title: "/judge/scoring" }
];

const mentorPlaceholders = [
  { path: "dashboard", title: "/mentor/dashboard" }
];

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<AuthLayout />}>
        <Route index element={<LoginPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/events" replace />} />

      <Route element={<MobileDiscoveryShell />}>
        <Route path="events" element={<EventsDiscoveryPage />} />
        <Route path="events/:eventId" element={<EventDetailPage />} />
      </Route>

      <Route
        path="/me"
        element={
          <CommandShell
            navItems={participantCommandNav}
            primaryAction={{
              label: "Release Problems",
              icon: "rocket_launch"
            }}
          />
        }
      >
        <Route index element={<ParticipantDashboardPage />} />
        <Route path="team" element={<MyTeamPage />} />

        {participantPlaceholders.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={<PlaceholderPage title={r.title} />}
          />
        ))}
      </Route>

      <Route
        path="/organizer"
        element={
          <CommandShell
            navItems={organizerNav}
            primaryAction={{
              label: "Release Problems",
              icon: "rocket_launch"
            }}
          />
        }
      >
        <Route path="dashboard" element={<OrganizerDashboardPage />} />

        {organizerPlaceholders.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={<PlaceholderPage title={r.title} />}
          />
        ))}
      </Route>

      <Route path="/judge" element={<CommandShell navItems={judgeNav} />}>
        {judgePlaceholders.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={<PlaceholderPage title={r.title} />}
          />
        ))}
      </Route>

      <Route path="/mentor" element={<CommandShell navItems={mentorNav} />}>
        {mentorPlaceholders.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={<PlaceholderPage title={r.title} />}
          />
        ))}
      </Route>

      <Route path="*" element={<Navigate to="/events" replace />} />
    </Routes>
  );
}