import { expect, test } from "@playwright/test";
import {
    activateFamilyContext,
    apiRequest,
    createFamily,
    createWallet,
    fetchJson,
    futureDate,
    login,
    openAddTransactionModal,
    switchToPersonalContext,
    uniqueName,
} from "./helpers/app";

test.describe.serial("member finance smoke", () => {
    test("member can run core finance flows and state stays consistent", async ({ page, request }) => {
        const selectOptionContaining = async (locator, text) => {
            const value = await locator.evaluate((element, expectedText) => {
                const option = [...element.options].find((item) => item.text.includes(expectedText));
                return option?.value || "";
            }, text);

            expect(value).toBeTruthy();
            await locator.selectOption(value);
        };

        const personalWalletName = uniqueName("qa-wallet");
        const secondaryWalletName = uniqueName("qa-transfer");
        const familyName = uniqueName("qa-family");
        const familyWalletName = uniqueName("qa-family-wallet");
        const goalName = uniqueName("qa-goal");
        const expenseNote = uniqueName("qa-expense");
        const transferNote = uniqueName("qa-transfer");

        await login(page, "member");

        await page.goto("/wallets");
        await expect(page.getByTestId("wallets-scope")).toContainText(/ph.m vi:\s*c. nh.n|scope:\s*personal/i);
        await expect(page.getByTestId("wallets-add-cta")).toContainText(/th.m v. c. nh.n|add personal wallet/i);

        await createWallet(page, { name: personalWalletName, balance: 1500000, type: "cash" });
        await createWallet(page, { name: secondaryWalletName, balance: 300000, type: "bank" });

        await page.getByText(/th.m v.|add wallet/i).last().click();
        await page.locator("#wallet-name").fill(personalWalletName);
        await page.locator("#wallet-balance").fill("100000");
        await page.locator("#wallet-type").selectOption("cash");
        await page.getByRole("button", { name: /t.o v.|create wallet|save/i }).last().click();
        await expect(page.getByText(/t.n v. .. t.n t.i|wallet name already exists/i).first()).toBeVisible();

        await createFamily(page, { name: familyName, description: "QA smoke family" });
        await activateFamilyContext(page, familyName);
        await Promise.all([
            page.waitForURL(/\/wallets$/),
            page.locator('a[href="/wallets"]').first().click(),
        ]);
        await expect(page.getByTestId("wallets-scope")).toContainText(new RegExp(familyName));
        await expect(page.getByTestId("wallets-add-cta")).toContainText(/th.m v. gia ..nh|add family wallet/i);
        await createWallet(page, { name: familyWalletName, balance: 400000, type: "cash" });
        await switchToPersonalContext(page);

        await openAddTransactionModal(page);
        const expenseForm = page.getByTestId("form-EXPENSE");
        await page.locator("#transaction-amount").fill("50000");
        await page.locator("#transaction-description").fill(expenseNote);
        await selectOptionContaining(expenseForm.getByTestId("source-wallet-select"), personalWalletName);
        await expenseForm.getByRole("button", { name: /th.m giao d.ch|add transaction/i }).click();
        await expect(page.getByText(/th.m giao d.ch m.i|add transaction/i)).toBeHidden();

        await openAddTransactionModal(page);
        await page.getByRole("tab", { name: /chuy.n kho.n|transfer/i }).click();
        const transferForm = page.getByTestId("form-TRANSFER");
        await expect(transferForm).toBeVisible();
        await page.locator("#transaction-amount").fill("25000");
        await page.locator("#transaction-description").fill(transferNote);
        await selectOptionContaining(transferForm.getByTestId("source-wallet-select"), personalWalletName);
        await selectOptionContaining(transferForm.getByTestId("dest-wallet-select"), secondaryWalletName);
        await transferForm.getByRole("button", { name: /x.c nh.n chuy.n|confirm transfer|transfer/i }).click();
        await expect(page.getByText(/th.m giao d.ch m.i|add transaction/i)).toBeHidden();

        await page.goto("/goals");
        await page.getByRole("button", { name: /t.o m.c ti.u|create goal/i }).click();
        await expect(page.locator("#goal-name")).toBeVisible();
        await page.locator("#goal-name").fill(goalName);
        await page.locator("#goal-amount").fill("300000");
        await page.locator("#goal-deadline").fill(futureDate(45));
        await page.locator('[data-testid="create-goal-submit"]').click();
        const createdGoalCard = page
            .getByTestId("goal-card")
            .filter({ has: page.getByRole("heading", { name: goalName, exact: true }) })
            .first();
        await expect(createdGoalCard).toBeVisible();
        await createdGoalCard.getByTestId("goal-deposit-open").click();
        const depositModal = page.locator('[data-testid="goal-deposit-modal"]');
        await expect(page.locator("#deposit-amount")).toBeVisible();
        await expect(depositModal.getByText(familyWalletName)).toHaveCount(0);
        await page.locator("#deposit-amount").fill("100000");
        await depositModal.getByTestId("goal-deposit-wallet-option").filter({ hasText: personalWalletName }).click();
        await depositModal.getByTestId("goal-deposit-submit").click();

        const walletsResult = await fetchJson(page, request, "/wallets");
        expect(walletsResult.response.ok()).toBeTruthy();
        const wallets = walletsResult.json.data || walletsResult.json.wallets || [];
        const personalWallet = wallets.find((wallet) => wallet.name === personalWalletName);
        const secondaryWallet = wallets.find((wallet) => wallet.name === secondaryWalletName);
        const familyWallet = wallets.find((wallet) => wallet.name === familyWalletName);

        expect(personalWallet).toBeTruthy();
        expect(secondaryWallet).toBeTruthy();
        expect(familyWallet).toBeTruthy();
        expect(Number(personalWallet.balance)).toBe(1325000);
        expect(Number(secondaryWallet.balance)).toBe(325000);
        expect(Number(familyWallet.balance)).toBe(400000);

        const goalsResult = await fetchJson(page, request, "/goals");
        expect(goalsResult.response.ok()).toBeTruthy();
        const createdGoal = (goalsResult.json.data || goalsResult.json.goals || []).find((goal) => goal.name === goalName);
        expect(createdGoal).toBeTruthy();
        expect(Number(createdGoal.currentAmount)).toBe(100000);

        const categoriesResult = await fetchJson(page, request, "/categories");
        expect(categoriesResult.response.ok()).toBeTruthy();
        const expenseCategory = (categoriesResult.json.data || []).find((category) => category.type === "EXPENSE");
        expect(expenseCategory?.id).toBeTruthy();

        const familiesResult = await fetchJson(page, request, "/families");
        expect(familiesResult.response.ok()).toBeTruthy();
        const createdFamily = (familiesResult.json.data || familiesResult.json.families || []).find((family) => family.name === familyName);
        expect(createdFamily?.id).toBeTruthy();

        const personalBudgetResponse = await apiRequest(page, request, "POST", "/budgets", {
            amount_limit: 500000,
            start_date: futureDate(1),
            end_date: futureDate(30),
            category_id: expenseCategory.id,
        });
        expect(personalBudgetResponse.status()).toBe(201);

        const familyBudgetResponse = await apiRequest(page, request, "POST", "/budgets", {
            amount_limit: 900000,
            start_date: futureDate(1),
            end_date: futureDate(30),
            category_id: expenseCategory.id,
            family_id: createdFamily.id,
        });
        expect(familyBudgetResponse.status()).toBe(201);

        await page.goto("/wallets");
        await expect(page.getByText(personalWalletName)).toBeVisible();
    });
});
