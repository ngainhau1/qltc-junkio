import { expect, test } from "@playwright/test";
import { assertNoRuntimeArtifacts, loginByApi } from "./helpers/app";
import { assertNoHorizontalOverflow, attachQaMonitor } from "./helpers/qa";

test("transactions screen supports filtering, detail modal, import modal and export", async ({ page, request }) => {
    const monitor = attachQaMonitor(page, "transactions-qa");

    await loginByApi(page, request, "member");
    await page.goto("/transactions");

    await expect(page.getByRole("heading", { name: /transactions|giao d.ch/i }).first()).toBeVisible();
    await page.getByRole("button", { name: /filter|b. l.c/i }).click();
    const filterPanel = page.locator(".rounded-xl.border.bg-card").first();
    await expect(filterPanel).toBeVisible();
    await filterPanel.locator("select").first().selectOption("EXPENSE");
    await page.getByPlaceholder(/search|t.m/i).fill("B");
    await expect(page.locator("[aria-label^='View details']").first()).toBeVisible();

    await page.getByRole("button", { name: /m.i nh.t|oldest|newest|c. nh.t/i }).click();
    await page.locator("[aria-label^='View details']").first().click();
    await expect(page.getByText(/transaction details|chi ti.t giao d.ch/i).first()).toBeVisible();
    await page.getByRole("button", { name: /close|.óng/i }).last().click();
    await expect(page.getByText(/transaction details|chi ti.t giao d.ch/i).first()).toBeHidden();

    await page.getByRole("button", { name: /import|nh.p/i }).first().click();
    await expect(page.getByText(/import|nh.p giao d.ch/i).first()).toBeVisible();
    await page.getByRole("button", { name: /cancel|h.y/i }).last().click();
    await expect(page.getByText(/import|nh.p giao d.ch/i).first()).toBeHidden();

    await page.getByRole("button", { name: /export|xu.t/i }).first().click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: /csv/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);

    await assertNoRuntimeArtifacts(page, "transactions");
    await assertNoHorizontalOverflow(page, "transactions");
    monitor.expectClean();
});
