import type { Page } from "@playwright/test";

/** Mock WebSocket /ws/commits so CommitConnectionBadge reaches connected state in E2E. */
export async function mockCommitWebSocket(page: Page) {
  await page.routeWebSocket("**/ws/commits**", () => {
    // Playwright accepts the connection; the browser fires onopen → "connected".
  });
}
