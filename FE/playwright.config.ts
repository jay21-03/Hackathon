import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: ["**/live/**"],
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
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
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
