import { expect, test } from "@playwright/test";
import { assertNoRuntimeArtifacts, login } from "./helpers/app";

test("language switch to English persists after reload", async ({ page }) => {
    await login(page, "member");
    await page.goto("/settings");

    const comboboxes = page.getByRole("combobox");
    await comboboxes.nth(1).click();
    await page.getByRole("option", { name: /english/i }).click();

    await page.goto("/wallets");
    await expect(page.getByRole("heading", { name: /wallets/i }).first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: /wallets/i }).first()).toBeVisible();
});

test("mobile navigation smoke uses translated labels and live buttons @mobile", async ({ page }) => {
    await login(page, "member");
    await expect(page.getByRole("heading", { name: /dashboard|t.ng quan/i }).first()).toBeVisible();
    await page.getByRole("link", { name: /wallets|v./i }).click();
    await expect(page).toHaveURL(/\/wallets$/);
    await page.getByRole("link", { name: /menu/i }).click();
    await expect(page).toHaveURL(/\/menu$/);
});

test("runtime text artifacts are absent on key Vietnamese screens", async ({ page }) => {
    await login(page, "member");

    for (const route of ["/", "/wallets", "/transactions", "/goals", "/settings"]) {
        await page.goto(route);
        await assertNoRuntimeArtifacts(page, route);
    }
});
