import { expect, test } from "@playwright/test";
import { assertNoRuntimeArtifacts, login } from "./helpers/app";

test("staff is blocked from admin route", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);
});

test("admin dashboard loads real data and logs tab responds", async ({ page }) => {
    await login(page, "admin");
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /qu.n tr.|admin/i }).first()).toBeVisible();
    await expect(page.locator("main .grid .p-6").first()).toBeVisible();

    await page.getByRole("button", { name: /activity logs|nh.t k. ho.t ..ng/i }).click();
    await expect(page.getByRole("heading", { name: /nh.t k.|activity logs/i }).first()).toBeVisible();
    await assertNoRuntimeArtifacts(page, "admin-dashboard");
});
