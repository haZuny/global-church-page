import { defineConfig, devices } from "@playwright/test";

const directusPort = Number(process.env.TEST_DIRECTUS_PORT ?? 8056);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
  webServer: [
    {
      command: `TEST_DIRECTUS_PORT=${directusPort} node tests/fixtures/directus-server.mjs`,
      url: `http://127.0.0.1:${directusPort}/health`,
      reuseExistingServer: false,
    },
    {
      command: `DIRECTUS_URL=http://127.0.0.1:${directusPort} DIRECTUS_ASSETS_URL=http://127.0.0.1:${directusPort} next dev --port 3100`,
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
    },
  ],
});
