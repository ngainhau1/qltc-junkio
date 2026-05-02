import { expect, test } from "@playwright/test";
import { assertNoRuntimeArtifacts, fetchJson, loginByApi } from "./helpers/app";
import { assertNoHorizontalOverflow, attachQaMonitor } from "./helpers/qa";

test("settings and profile controls work without runtime artifacts", async ({ page, request }) => {
    const monitor = attachQaMonitor(page, "settings-profile");

    await loginByApi(page, request, "member");

    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /settings|c.i .*t/i }).first()).toBeVisible();
    await page.getByText(/giao di.n t.i|dark/i).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("tab", { name: /account|t.i kho.n/i }).click();
    await page.getByRole("button", { name: /logout|..ng xu.t/i }).first().click();
    await expect(page.getByRole("dialog").first()).toBeVisible();
    await page.getByRole("button", { name: /keep|gi. t.i|cancel|h.y/i }).first().click();
    await expect(page).not.toHaveURL(/\/login$/);
    await assertNoRuntimeArtifacts(page, "settings");
    await assertNoHorizontalOverflow(page, "settings");

    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: /profile|h. s./i }).first()).toBeVisible();
    const phone = `09${Date.now().toString().slice(-8)}`;
    await page.locator("#phone").fill(phone);
    await page.getByRole("button", { name: /save|l.u/i }).last().click();

    const profileResult = await fetchJson(page, request, "/users/me");
    expect(profileResult.response.ok()).toBeTruthy();
    expect(profileResult.json.status).toBe("success");
    expect(profileResult.json.data?.phone).toBe(phone);

    await assertNoRuntimeArtifacts(page, "profile");
    await assertNoHorizontalOverflow(page, "profile");
    monitor.expectClean();
});
