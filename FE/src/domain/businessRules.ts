export interface TeamCandidate {
  eventId: number | string;
  name: string;
  memberEmails: string[];
}

export interface ExistingTeamMember {
  eventId: number | string;
  email: string;
  teamName: string;
}

export interface RubricCriterion {
  name: string;
  min: number;
  max: number;
  score: number;
}

export function uniqueEmails(emails: string[]) {
  return Array.from(
    new Set(
      emails
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export function validateTeamRegistration(
  candidate: TeamCandidate,
  existingMembers: ExistingTeamMember[] = []
) {
  const errors: string[] = [];
  const members = uniqueEmails(candidate.memberEmails);

  if (!candidate.name.trim()) errors.push("Tên đội là bắt buộc.");
  if (members.length < 1 || members.length > 5) {
    errors.push("Đội thi phải có từ 1 đến 5 thành viên.");
  }

  const duplicatedInEvent = existingMembers.find(
    (member) =>
      String(member.eventId) === String(candidate.eventId) &&
      members.includes(member.email.trim().toLowerCase())
  );

  if (duplicatedInEvent) {
    errors.push(
      `${duplicatedInEvent.email} da thuoc doi ${duplicatedInEvent.teamName} trong cuộc thi nay.`
    );
  }

  return { valid: errors.length === 0, errors, normalizedEmails: members };
}

export function decideRegistrationStatus(confirmedTeams: number, quota: number) {
  if (quota <= 0) return "REJECTED";
  return confirmedTeams < quota ? "PENDING" : "WAITLIST";
}

export function canViewProblem(now: Date, releaseAt: string | Date) {
  return now.getTime() >= new Date(releaseAt).getTime();
}

export function validateRubricScores(criteria: RubricCriterion[]) {
  const errors = criteria
    .filter((criterion) => criterion.score < criterion.min || criterion.score > criterion.max)
    .map(
      (criterion) =>
        `${criterion.name}: diem phai nam trong khoang ${criterion.min}-${criterion.max}.`
    );
  return { valid: errors.length === 0, errors };
}
