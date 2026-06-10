import { defineConfig, devices } from "@playwright/test";

process.env.LIVE_STACK = process.env.LIVE_STACK ?? "1";

export default defineConfig({
  testDir: "./tests/e2e/live",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalSetup: "./tests/e2e/live/global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_ENABLE_GITHUB_PROVISIONING: "true",
      VITE_ENABLE_PHASE_7: "true",
      VITE_ENABLE_ACADEMIC_TERMS: "true"
    }
  },
  projects: [{ name: "live-chrome", use: { ...devices["Desktop Chrome"] } }]
});
