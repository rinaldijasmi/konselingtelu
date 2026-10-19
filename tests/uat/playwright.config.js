import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  globalSetup: "./global-setup.js",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1,
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: process.env.UAT_BASE_URL || "https://rinaldijasmi.github.io/konselingtelu/",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "id-ID"
  }
});
