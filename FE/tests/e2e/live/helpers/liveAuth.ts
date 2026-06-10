import type { Page } from "@playwright/test";

export type LiveUserRole = "participant" | "organizer" | "mentor" | "judge";

export interface LiveAuthSession {
  token: string;
  email: string;
  name: string;
  roles: string[];
}

export function resolveLiveRole(roles: string[]): LiveUserRole {
  const normalized = roles.map((role) => role.toUpperCase());
  if (normalized.includes("ORGANIZER")) return "organizer";
  if (normalized.includes("MENTOR")) return "mentor";
  if (normalized.includes("JUDGE")) return "judge";
  return "participant";
}

export async function injectLiveAuth(page: Page, session: LiveAuthSession, activeEventId?: number) {
  const role = resolveLiveRole(session.roles);
  await page.addInitScript(
    ({ token, profile, eventId }) => {
      window.localStorage.setItem("seal.auth.token", token);
      window.localStorage.setItem(
        "seal.auth.session",
        JSON.stringify({ role: profile.role, email: profile.email, name: profile.name })
      );
      if (eventId != null) {
        window.localStorage.setItem("seal.activeEventId", String(eventId));
      }
    },
    {
      token: session.token,
      profile: { role, email: session.email, name: session.name },
      eventId: activeEventId ?? null
    }
  );
}
