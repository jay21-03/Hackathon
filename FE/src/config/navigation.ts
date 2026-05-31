export type NavItem = {
  to: string;
  label: string;
  icon: string;
};

export const participantMobileNav: NavItem[] = [
  { to: "/events", label: "Events", icon: "event_note" },
  { to: "/me/team", label: "Team", icon: "groups" },
  { to: "/me/check-in", label: "Check-in", icon: "how_to_reg" },
  { to: "/me/profile", label: "Profile", icon: "person" }
];

export const organizerNav: NavItem[] = [
  { to: "/organizer/dashboard", label: "Overview", icon: "dashboard" },
  { to: "/organizer/events", label: "Events", icon: "event" },
  { to: "/organizer/boards", label: "Board Logic", icon: "grid_view" },
  { to: "/organizer/check-ins", label: "Check-ins", icon: "group_add" },
  { to: "/organizer/scoring", label: "Live Judging", icon: "gavel" },
  { to: "/organizer/ranking", label: "Leaderboard", icon: "leaderboard" }
];

export const judgeNav: NavItem[] = [
  { to: "/judge/dashboard", label: "Assigned Teams", icon: "assignment" },
  { to: "/judge/scoring", label: "Score Sheet", icon: "gavel" }
];

export const mentorNav: NavItem[] = [
  { to: "/mentor/dashboard", label: "My Teams", icon: "groups" }
];

export const participantCommandNav: NavItem[] = [
  { to: "/me", label: "Overview", icon: "dashboard" },
  { to: "/me/team", label: "My Team", icon: "groups" },
  { to: "/me/check-in", label: "Check-in", icon: "how_to_reg" },
  { to: "/me/problem", label: "Problem", icon: "code" },
  { to: "/me/results", label: "Results", icon: "leaderboard" }
];

export const stitchScreenMap: Record<string, string> = {
  "/login": "login_google_sign_in",
  "/events": "hackathon_discovery",
  "/me": "participant_dashboard",
  "/me/team": "my_team_hub",
  "/me/profile": "user_profile_edit_profile",
  "/me/check-in": "check_in_gateway",
  "/me/problem": "participant_live_contest_view",
  "/me/results": "final_results_standings",
  "/organizer/dashboard": "organizer_dashboard",
  "/organizer/events": "event_configuration",
  "/organizer/boards": "board_management_assignment",
  "/organizer/check-ins": "check_in_management",
  "/organizer/scoring": "scoring_progress_monitor",
  "/organizer/ranking": "ranking_advancement",
  "/judge/dashboard": "assigned_teams_for_judging",
  "/judge/scoring": "judge_score_sheet",
  "/mentor/dashboard": "mentor_dashboard_assigned_teams"
};
