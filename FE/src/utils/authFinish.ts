import {
  getRoleHome,
  resolveRoleFromApiRoles,
  setAuthenticated,
  setAuthSession,
  type UserRole
} from "../auth/authSession";
import { setAccessToken } from "../auth/tokenStorage";
import type { AuthResponse } from "../services/authService";
import { fetchPublicEvents } from "../services/eventsApi";
import { fetchMyTeams } from "../services/registrationService";
import { fetchCurrentUser } from "../services/userService";
import { setStoredActiveEventId } from "../hooks/useActiveEvent";
import { isStaffInvitationActionPath } from "./staffInvitationPaths";

async function resolveParticipantHome(): Promise<string> {
  try {
    const events = await fetchPublicEvents();
    for (const event of events) {
      const teams = await fetchMyTeams(event.id);
      if (teams.length > 0) {
        setStoredActiveEventId(event.id);
        return "/me";
      }
    }
  } catch {
    /* fallback */
  }
  return "/events";
}

export async function finishAuthSession(result: AuthResponse, options?: { from?: string }) {
  setAccessToken(result.accessToken);

  const me = await fetchCurrentUser();

  const role: UserRole = resolveRoleFromApiRoles(me.roles);
  const profileCompleted = me.profileCompleted !== false;
  setAuthSession({
    role,
    email: me.email,
    name: me.fullName || me.email,
    profileCompleted
  });
  setAuthenticated(true);

  if (!profileCompleted) {
    const from = options?.from ? `?from=${encodeURIComponent(options.from)}` : "";
    window.location.href = `/login/complete-profile${from}`;
    return;
  }

  const staffRoles = (me.roles ?? []).map((role) => role.toUpperCase());
  const isStaff = staffRoles.some((role) =>
    role === "ORGANIZER" || role === "MENTOR" || role === "JUDGE"
  );
  const returningToStaffInvite = isStaffInvitationActionPath(options?.from);
  if (!isStaff && me.status === "PENDING_APPROVAL" && !returningToStaffInvite) {
    window.location.href = "/login/pending-approval";
    return;
  }

  if (options?.from) {
    window.location.href = options.from;
    return;
  }

  if (role === "participant") {
    window.location.href = await resolveParticipantHome();
    return;
  }

  window.location.href = getRoleHome(role);
}
