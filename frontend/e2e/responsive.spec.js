import { expect, test } from "@playwright/test";
import { assertNoRuntimeArtifacts, loginByApi } from "./helpers/app";
import {
    assertNoHorizontalOverflow,
    assertPrimaryNavigationFitsViewport,
    attachQaMonitor,
} from "./helpers/qa";

const memberRoutes = [
    "/",
    "/transactions",
    "/wallets",
    "/budgets",
    "/goals",
    "/family",
    "/reports",
    "/forecast",
    "/settings",
    "/profile",
    "/menu",
];

const viewports = [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 414, height: 896 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
];

test("member UI has no runtime artifacts or horizontal overflow across required viewports", async ({ page, request }) => {
    test.setTimeout(300_000);
    const monitor = attachQaMonitor(page, "member-responsive");

    await loginByApi(page, request, "member");

    for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        for (const route of memberRoutes) {
            const label = `${route} @ ${viewport.width}x${viewport.height}`;
            await page.goto(route);
            await expect(page.getByRole("heading").first(), `Heading should load on ${label}`).toBeVisible();
            await assertPrimaryNavigationFitsViewport(page, label);
            await assertNoRuntimeArtifacts(page, label);
            await assertNoHorizontalOverflow(page, label);
        }
    }

    monitor.expectClean();
});

test("admin UI has no runtime artifacts or horizontal overflow across required viewports", async ({ page, request }) => {
    test.setTimeout(180_000);
    const monitor = attachQaMonitor(page, "admin-responsive");

    await loginByApi(page, request, "admin");

    for (const viewport of viewports) {
        const label = `/admin @ ${viewport.width}x${viewport.height}`;
        await page.setViewportSize(viewport);
        await page.goto("/admin");
        await expect(page.getByRole("heading").first(), `Admin heading should load on ${label}`).toBeVisible();
        await assertPrimaryNavigationFitsViewport(page, label);
        await assertNoRuntimeArtifacts(page, label);
        await assertNoHorizontalOverflow(page, label);
    }

    monitor.expectClean();
});
