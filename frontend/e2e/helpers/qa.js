import { expect } from "@playwright/test";

export function attachQaMonitor(page, label) {
    const issues = [];

    page.on("console", (message) => {
        if (message.type() === "error") {
            issues.push({
                type: "console",
                label,
                text: message.text(),
            });
        }
    });

    page.on("response", (response) => {
        const status = response.status();
        const url = response.url();

        if (status >= 500) {
            issues.push({
                type: "network",
                label,
                status,
                url,
            });
        }
    });

    return {
        issues,
        expectClean() {
            expect(issues, `Runtime issues on ${label}`).toEqual([]);
        },
    };
}

export async function assertNoHorizontalOverflow(page, label) {
    await page.waitForLoadState("networkidle").catch(() => {});

    const result = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        const viewportWidth = window.innerWidth;
        const documentWidth = Math.max(root.scrollWidth, body?.scrollWidth || 0);
        const offenders = [...document.querySelectorAll("body *")]
            .map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                    tag: element.tagName.toLowerCase(),
                    id: element.id || "",
                    className: String(element.className || "").slice(0, 120),
                    width: Math.round(rect.width),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80),
                };
            })
            .filter((item) => item.right > viewportWidth + 2 || item.left < -2)
            .slice(0, 8);

        return {
            viewportWidth,
            documentWidth,
            overflow: documentWidth - viewportWidth,
            offenders,
        };
    });

    expect(
        result.overflow <= 2,
        `Horizontal overflow on ${label}: ${JSON.stringify(result)}`
    ).toBeTruthy();
}

export async function assertPrimaryNavigationFitsViewport(page, label) {
    const viewport = page.viewportSize();
    if (!viewport) {
        return;
    }

    if (viewport.width < 768) {
        await expect(
            page.getByRole("navigation").first(),
            `Mobile bottom navigation should be visible on ${label}`
        ).toBeVisible();
        return;
    }

    await expect(
        page.getByText("Junkio Finance").first(),
        `Desktop sidebar should be visible on ${label}`
    ).toBeVisible();
}
