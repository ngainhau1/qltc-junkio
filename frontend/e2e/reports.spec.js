import { expect, test } from "@playwright/test";
import { assertNoRuntimeArtifacts, fetchJson, login } from "./helpers/app";
import { assertNoHorizontalOverflow, attachQaMonitor } from "./helpers/qa";

const mojibakePattern = /(?:Ã|Ä|Æ|áÂ|Â|\?n U\?ng|Di Chuy\?n|L\?\?ng)/;

test("reports render localized financial charts and exports", async ({ page, request }) => {
    const monitor = attachQaMonitor(page, "reports");

    await login(page, "member");

    const reportsResult = await fetchJson(page, request, "/analytics/reports?context=personal");
    expect(reportsResult.response.ok()).toBeTruthy();
    expect(reportsResult.json.status).toBe("success");
    expect(Number(reportsResult.json.data?.summary?.totalExpense || 0)).toBeGreaterThan(0);

    const categories = reportsResult.json.data?.expenseByCategory || [];
    expect(categories.length).toBeGreaterThan(0);
    for (const category of categories) {
        expect(String(category.name), `Bad category label: ${category.name}`).not.toMatch(mojibakePattern);
    }

    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: /b.o c.o|reports/i }).first()).toBeVisible();
    await expect(page.getByText(/chi ti.u theo danh m.c|category/i).first()).toBeVisible();
    await expect(page.getByText(/.n u.ng|food|gi.o d.c|education/i).first()).toBeVisible();

    for (const buttonName of [/pdf/i, /csv/i, /excel/i]) {
        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: buttonName }).first().click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.(pdf|csv|xlsx)$/i);
    }

    await assertNoRuntimeArtifacts(page, "reports");
    await assertNoHorizontalOverflow(page, "reports");
    monitor.expectClean();
});
