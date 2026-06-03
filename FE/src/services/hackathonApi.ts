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

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085/api";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`API ${path} failed`);
  return response.json() as Promise<T>;
}

export function fetchRubricConfig() {
  return withApiFallback(() => getJson<typeof baseRubric>(`/events/${demoEvent.id}/rubric`), baseRubric);
}

export function fetchBoardAssignments() {
  return withApiFallback(() => getJson<typeof demoBoards>(`/events/${demoEvent.id}/boards`), demoBoards);
}

export function fetchAiReviewQueue() {
  return withApiFallback(() => getJson<typeof demoAiFindings>(`/events/${demoEvent.id}/ai-review/findings`), demoAiFindings);
}

export function fetchAiReviewInsights() {
  return withApiFallback(() => getJson<typeof demoTeams>(`/events/${demoEvent.id}/ai-review/teams`), demoTeams);
}

export function fetchNotifications() {
  return withApiFallback(
    () => getJson<typeof demoAnnouncements>(`/events/${demoEvent.id}/notifications`),
    demoAnnouncements
  );
}

export function fetchPublishPreview() {
  return withApiFallback(
    () =>
      getJson<{
        rankings: ReturnType<typeof getRankingRows>;
        submittedSheets: typeof demoScoreSheets;
      }>(`/events/${demoEvent.id}/results/preview`),
    {
      rankings: getRankingRows(),
      submittedSheets: demoScoreSheets.filter((sheet) => sheet.status === "SUBMITTED")
    }
  );
}

export function fetchMentorDashboard() {
  return withApiFallback(
    () => getJson<{ boards: typeof demoBoards; teams: typeof demoTeams; findings: typeof demoAiFindings }>(`/mentor/dashboard`),
    {
      boards: demoBoards.filter((board) => board.mentor === "An Le"),
      teams: demoTeams.filter((team) => team.board === "Bang Alpha"),
      findings: demoAiFindings
    }
  );
}

export function fetchJudgeDashboard() {
  return withApiFallback(
    () => getJson<{ teams: typeof demoTeams; scoreSheets: typeof demoScoreSheets }>(`/judge/dashboard`),
    {
      teams: demoTeams.filter((team) => team.board === "Bang Alpha"),
      scoreSheets: demoScoreSheets.filter((sheet) => ["Dr. Chen", "S. Malik"].includes(sheet.judge))
    }
  );
}
