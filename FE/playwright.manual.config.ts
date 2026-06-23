import { defineConfig, devices } from "@playwright/test";

/** E2E với provision GitHub tắt — form nộp link thủ công. */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/manual-submission.spec.ts",
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev -- --port 5174",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_ENABLE_GITHUB_PROVISIONING: "false",
      VITE_ENABLE_PHASE_7: "true",
      VITE_ENABLE_ACADEMIC_TERMS: "true"
    }
  },
  projects: [
    {
      name: "manual-submission",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
