import { expect } from "@playwright/test";

export const users = {
    admin: { email: "admin@junkio.com", password: "admin123" },
    staff: { email: "staff@junkio.com", password: "staff123" },
    member: { email: "demo@junkio.com", password: "demo123" },
};

export const apiBaseUrl = process.env.E2E_API_URL || "http://localhost:5000/api";

export function uniqueName(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function futureDate(days = 30) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
}

export async function login(page, role = "member") {
    const credentials = users[role];
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(credentials.email);
    await page.getByLabel(/m.t kh.u|password/i).fill(credentials.password);
    await page.getByRole("button", { name: /..ng nh.p|login/i }).click();

    await page.waitForFunction(
        () => Boolean(window.localStorage.getItem("auth_token")),
        { timeout: 20_000 }
    );
    await page.waitForFunction(
        () => window.location.pathname !== "/login",
        { timeout: 20_000 }
    );
    await expect(page).not.toHaveURL(/\/login$/);
}

export async function logout(page) {
    await page.goto("/settings");
    const accountTab = page.getByRole("tab", { name: /t.i kho.n|account/i });
    if (await accountTab.count()) {
        await accountTab.click();
    }

    await page.getByRole("button", { name: /..ng xu.t|logout/i }).first().click();
    const confirmButton = page.getByRole("button", { name: /x.c nh.n ..ng xu.t|confirm logout|..ng xu.t/i }).last();
    if (await confirmButton.count()) {
        await confirmButton.click();
    }
    await expect(page).toHaveURL(/\/login$/);
}

export async function openAddTransactionModal(page) {
    const buttons = [
        page.getByRole("button", { name: /th.m giao d.ch|add transaction/i }).first(),
        page.locator('button[title*="Giao"]').first(),
        page.locator('button[aria-label*="giao" i]').first(),
        page.locator('button[aria-label*="transaction" i]').first(),
    ];

    for (const button of buttons) {
        if (await button.count()) {
            await button.click();
            break;
        }
    }

    await expect(page.getByText(/th.m giao d.ch m.i|add transaction/i)).toBeVisible();
}

export async function createWallet(page, { name, balance, type = "cash" }) {
    if (!/\/wallets$/.test(page.url())) {
        const walletsLink = page.locator('a[href="/wallets"]').first();
        if (await walletsLink.count()) {
            await Promise.all([
                page.waitForURL(/\/wallets$/),
                walletsLink.click(),
            ]);
        } else {
            await page.goto("/wallets");
        }
    }
    await page.waitForLoadState("networkidle");
    await page.getByText(/th.m v.|add wallet/i).last().click();
    await page.locator("#wallet-name").fill(name);
    await page.locator("#wallet-balance").fill(String(balance));
    await page.locator("#wallet-type").selectOption(type);
    await page.getByRole("button", { name: /t.o v.|create wallet|save/i }).last().click();
    await expect(page.getByText(name)).toBeVisible();
}

export async function createFamily(page, { name, description }) {
    await page.goto("/family");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /t.o gia ..nh|create family/i }).click();
    const textboxes = page.getByRole("textbox");
    const count = await textboxes.count();
    await textboxes.nth(count - 2).fill(name);
    await textboxes.nth(count - 1).fill(description);
    await page.getByRole("button", { name: /t.o nh.m|t.o m.i|create/i }).last().click();
    await expect(page.getByText(name)).toBeVisible();
}

export async function activateFamilyContext(page, familyName) {
    const familyCard = page.locator('[data-testid="family-card"]').filter({
        has: page.getByText(familyName, { exact: true }),
    }).first();
    await expect(familyCard).toBeVisible();
    const button = familyCard.getByTestId("family-switch-button");
    await button.click();
    await expect(button).toHaveText(/.ang ch.n|active/i);
}

export async function switchToPersonalContext(page) {
    await page.getByRole("button", { name: /ng. c.nh|context/i }).first().click();
    await page.getByRole("menuitem", { name: /c. nh.n|personal/i }).first().click();
}

export async function getAccessToken(page) {
    return page.evaluate(() => localStorage.getItem("auth_token"));
}

export async function apiRequest(page, request, method, path, body) {
    const token = await getAccessToken(page);
    return request.fetch(`${apiBaseUrl}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        data: body,
    });
}

export async function fetchJson(page, request, path) {
    const response = await apiRequest(page, request, "GET", path);
    const json = await response.json();
    return { response, json };
}

export async function assertNoRuntimeArtifacts(page, label) {
    const issuesByAttempt = [];
    const mojibakePattern = /(?:Ã.|Â.|Ä.|Æ.|á»|â(?:‚¬|€¢|€¦|€œ|€˜|€™|€“|€”))/;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        await page.waitForLoadState("networkidle").catch(() => { });

        const text = await page.locator("body").innerText();
        const issues = [];

        if (/\bundefined\b/i.test(text)) issues.push("undefined");
        if (/\bnull\b/i.test(text)) issues.push("null");
        if (mojibakePattern.test(text)) issues.push("mojibake");

        const rawKeyMatches = [...text.matchAll(/\b[a-z][a-z0-9_-]*(?:\.[a-z0-9_-]+){1,}\b/g)]
            .map((match) => match[0])
            .filter((value) => !/^https?\./i.test(value))
            .filter((value) => !value.includes(".com"))
            .filter((value) => !value.startsWith("vite."))
            .filter((value) => !value.startsWith("react."));

        if (rawKeyMatches.length > 0) {
            issues.push(`raw-keys:${[...new Set(rawKeyMatches)].slice(0, 5).join(",")}`);
        }

        if (issues.length === 0) {
            expect(issues, `Runtime UI artifacts on ${label}`).toEqual([]);
            return;
        }

        issuesByAttempt.push({
            attempt: attempt + 1,
            issues,
            sample: text.slice(0, 250),
        });

        await page.waitForTimeout(400);
    }

    const lastAttempt = issuesByAttempt.at(-1);
    expect(
        lastAttempt?.issues ?? [],
        `Runtime UI artifacts on ${label}: ${JSON.stringify(lastAttempt)}`,
    ).toEqual([]);
}
