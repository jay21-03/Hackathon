/** True when the user is on (or returning to) staff invitation accept/decline. */
export function isStaffInvitationActionPath(path: string | undefined | null): boolean {
  if (!path) return false;
  return /\/staff-invitations\/(accept|decline)(?:[?#]|$)/.test(path);
}
