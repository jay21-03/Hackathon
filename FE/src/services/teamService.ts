import { demoTeamMembers, demoTeams } from "../mocks/hackathonDemoData";
import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";

export function fetchTeams() {
  return withApiFallback(async () => (await apiClient.get<typeof demoTeams>("/teams")).data, demoTeams);
}

export function fetchTeamMembers(teamId: number) {
  return withApiFallback(
    async () => (await apiClient.get<typeof demoTeamMembers>(`/teams/${teamId}/members`)).data,
    demoTeamMembers.filter((member) => member.teamId === teamId)
  );
}
