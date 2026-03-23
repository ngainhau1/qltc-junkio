import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://localhost";

export default defineConfig({
    testDir: "./e2e",
    timeout: 60_000,
    expect: {
        timeout: 10_000,
    },
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: [
        ["list"],
        ["html", { open: "never", outputFolder: "../output/playwright/report" }],
    ],
    outputDir: "../output/playwright/test-results",
    use: {
        baseURL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        viewport: { width: 1440, height: 900 },
    },
    projects: [
        {
            name: "chromium-desktop",
            grepInvert: /@mobile/,
            use: {
                ...devices["Desktop Chrome"],
                baseURL,
            },
        },
        {
            name: "chromium-mobile",
            grep: /@mobile/,
            use: {
                ...devices["Pixel 7"],
                baseURL,
            },
        },
    ],
});
