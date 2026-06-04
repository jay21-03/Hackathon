import type { TeamDetailResponse } from "../services/registrationService";
import { getStatusLabel } from "../domain/status";

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadTeamsCsv(teams: TeamDetailResponse[], filename: string) {
  const headers = ["team_id", "team_name", "status", "member_count", "members", "confirmed_at"];
  const rows = teams.map((team) => {
    const members = (team.members ?? [])
      .map((m) => `${m.fullName} <${m.email}> (${getStatusLabel(m.status)})`)
      .join("; ");
    return [
      String(team.id),
      team.name,
      getStatusLabel(team.status),
      String(team.members?.length ?? 0),
      members,
      team.confirmedAt ?? ""
    ]
      .map(escapeCsv)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
