import type { TeamDetailResponse } from "../services/registrationService";
import { getStatusLabel } from "../domain/status";

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadTeamsCsv(teams: TeamDetailResponse[], filename: string) {
  const headers = [
    "team_id",
    "team_name",
    "status",
    "member_email",
    "member_name",
    "student_id",
    "university",
    "member_status",
    "contact_person",
    "confirmed_at"
  ];
  const rows: string[] = [];
  for (const team of teams) {
    const members = team.members ?? [];
    if (members.length === 0) {
      rows.push(
        [
          String(team.id),
          team.name,
          getStatusLabel(team.status),
          "",
          "",
          "",
          "",
          "",
          "",
          team.confirmedAt ?? ""
        ]
          .map(escapeCsv)
          .join(",")
      );
      continue;
    }
    for (const member of members) {
      rows.push(
        [
          String(team.id),
          team.name,
          getStatusLabel(team.status),
          member.email,
          member.fullName,
          member.studentId ?? "",
          member.university ?? "",
          getStatusLabel(member.status),
          member.contactPerson ? "yes" : "no",
          team.confirmedAt ?? ""
        ]
          .map(escapeCsv)
          .join(",")
      );
    }
  }

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
