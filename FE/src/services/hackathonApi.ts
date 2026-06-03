import {
  baseRubric,
  demoAiFindings,
  demoAnnouncements,
  demoBoards,
  demoEvent,
  demoScoreSheets,
  demoTeams,
  getRankingRows
} from "../mocks/hackathonDemoData";
import { withApiFallback } from "./apiFallback";
import { apiClient } from "./apiClient";

export function fetchRubricConfig() {
  return withApiFallback(() => apiClient.get<typeof baseRubric>(`/events/${demoEvent.id}/rubric`).then((r) => r.data), baseRubric);
}

export function fetchBoardAssignments() {
  return withApiFallback(() => apiClient.get<typeof demoBoards>(`/events/${demoEvent.id}/boards`).then((r) => r.data), demoBoards);
}

export function fetchAiReviewQueue() {
  return withApiFallback(() => apiClient.get<typeof demoAiFindings>(`/events/${demoEvent.id}/ai-review/findings`).then((r) => r.data), demoAiFindings);
}

export function fetchAiReviewInsights() {
  return withApiFallback(() => apiClient.get<typeof demoTeams>(`/events/${demoEvent.id}/ai-review/teams`).then((r) => r.data), demoTeams);
}

export function fetchNotifications() {
  return withApiFallback(() => apiClient.get<typeof demoAnnouncements>(`/events/${demoEvent.id}/notifications`).then((r) => r.data), demoAnnouncements);
}

export function fetchPublishPreview() {
  return withApiFallback(
    () => apiClient.get<{
      rankings: ReturnType<typeof getRankingRows>;
      submittedSheets: typeof demoScoreSheets;
    }>(`/events/${demoEvent.id}/results/preview`).then((r) => r.data),
    {
      rankings: getRankingRows(),
      submittedSheets: demoScoreSheets.filter((sheet) => sheet.status === "SUBMITTED")
    }
  );
}

export function fetchMentorDashboard() {
  return withApiFallback(
    () => apiClient.get<{ boards: typeof demoBoards; teams: typeof demoTeams; findings: typeof demoAiFindings }>(`/mentor/dashboard`).then((r) => r.data),
    {
      boards: demoBoards.filter((board) => board.mentor === "An Le"),
      teams: demoTeams.filter((team) => team.board === "Bang Alpha"),
      findings: demoAiFindings
    }
  );
}

export function fetchJudgeDashboard() {
  return withApiFallback(
    () => apiClient.get<{ teams: typeof demoTeams; scoreSheets: typeof demoScoreSheets }>(`/judge/dashboard`).then((r) => r.data),
    {
      teams: demoTeams.filter((team) => team.board === "Bang Alpha"),
      scoreSheets: demoScoreSheets.filter((sheet) => ["Dr. Chen", "S. Malik"].includes(sheet.judge))
    }
  );
}
