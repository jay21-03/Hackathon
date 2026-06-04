import type { Page } from "@playwright/test";

export type E2ERole = "participant" | "organizer" | "mentor" | "judge";

export const E2E_AUTH_TOKEN = "e2e-test-token";

export const roleProfiles: Record<E2ERole, { role: E2ERole; email: string; name: string }> = {
  participant: {
    role: "participant",
    email: "participant@seal.edu.vn",
    name: "Thí sinh E2E"
  },
  organizer: {
    role: "organizer",
    email: "organizer@seal.edu.vn",
    name: "Ban tổ chức E2E"
  },
  mentor: {
    role: "mentor",
    email: "mentor@seal.edu.vn",
    name: "Mentor E2E"
  },
  judge: {
    role: "judge",
    email: "judge@seal.edu.vn",
    name: "Giám khảo E2E"
  }
};

export async function seedAuth(page: Page, role: E2ERole) {
  await page.addInitScript(
    ({ profile, token }) => {
      window.localStorage.setItem("seal.auth.session", JSON.stringify(profile));
      window.localStorage.setItem("seal.auth.token", token);
      window.localStorage.setItem("seal.activeEventId", "1");
    },
    { profile: roleProfiles[role], token: E2E_AUTH_TOKEN }
  );
}
