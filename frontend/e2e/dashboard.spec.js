import { expect, test } from "@playwright/test";
import {
    assertNoRuntimeArtifacts,
    fetchJson,
    login,
    openAddTransactionModal,
} from "./helpers/app";
import { assertNoHorizontalOverflow, attachQaMonitor } from "./helpers/qa";

test("dashboard shows seeded month-to-date data and usable live widgets", async ({ page, request }) => {
    const monitor = attachQaMonitor(page, "dashboard");

    await login(page, "member");

    const dashboardResult = await fetchJson(page, request, "/analytics/dashboard?context=personal");
    expect(dashboardResult.response.ok()).toBeTruthy();
    expect(dashboardResult.json.status).toBe("success");
    expect(Number(dashboardResult.json.data?.stats?.totalIncome || 0)).toBeGreaterThan(0);
    expect(Number(dashboardResult.json.data?.stats?.totalExpense || 0)).toBeGreaterThan(0);
    expect(Number(dashboardResult.json.data?.stats?.transactionsThisMonthCount || 0)).toBeGreaterThan(0);

    const goldResult = await fetchJson(page, request, "/market/gold");
    expect(goldResult.response.ok()).toBeTruthy();
    expect(goldResult.json.status).toBe("success");
    expect(Number(goldResult.json.data?.buy || 0)).toBeGreaterThan(0);
    expect(Number(goldResult.json.data?.sell || 0)).toBeGreaterThan(0);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /dashboard|t.ng quan/i }).first()).toBeVisible();
    await expect(page.getByText(/gi. v.ng live|gold/i).first()).toBeVisible();
    await expect(page.getByText(/giao d.ch g.n .*y|recent transactions/i).first()).toBeVisible();
    await expect(page.getByText(/\+?25\.180\.000|25,180,000|25\.18/i).first()).toBeVisible();

    await openAddTransactionModal(page);
    await expect(page.getByTestId("form-EXPENSE")).toBeVisible();

    await assertNoRuntimeArtifacts(page, "dashboard");
    await assertNoHorizontalOverflow(page, "dashboard");
    monitor.expectClean();
});
