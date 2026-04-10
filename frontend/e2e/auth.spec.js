import { expect, test } from "@playwright/test";
import { login, logout } from "./helpers/app";

test("guest is redirected and member session survives reload", async ({ page }) => {
    await page.goto("/wallets");
    await expect(page).toHaveURL(/\/login$/);

    await login(page, "member");
    await expect(page.getByText(/xin ch.o|hello/i).first()).toBeVisible();

    await page.reload();
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByRole("heading").first()).toBeVisible();

    await logout(page);
});
