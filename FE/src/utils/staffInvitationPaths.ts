const STAFF_INVITE_RETURN_KEY = "staffInvitationReturnTo";

/** True when the user is on (or returning to) staff invitation accept/decline. */
export function isStaffInvitationActionPath(path: string | undefined | null): boolean {
  if (!path) return false;
  return /\/staff-invitations\/(accept|decline)(?:[?#]|$)/.test(path);
}

/** Lưu URL lời mời để không mất khi đăng nhập / đăng ký / hoàn tất hồ sơ. */
export function rememberStaffInvitationReturn(path: string) {
  try {
    sessionStorage.setItem(STAFF_INVITE_RETURN_KEY, path);
  } catch {
    /* ignore */
  }
}

export function peekStaffInvitationReturn(): string | null {
  try {
    return sessionStorage.getItem(STAFF_INVITE_RETURN_KEY);
  } catch {
    return null;
  }
}

export function consumeStaffInvitationReturn(): string | null {
  const value = peekStaffInvitationReturn();
  if (value) {
    try {
      sessionStorage.removeItem(STAFF_INVITE_RETURN_KEY);
    } catch {
      /* ignore */
    }
  }
  return value;
}