import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const srcDir = path.join(rootDir, "src");
const localeDir = path.join(srcDir, "locales");
const viPath = path.join(localeDir, "vi", "translation.json");
const enPath = path.join(localeDir, "en", "translation.json");

const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const issueLines = [];

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function flattenObject(input, prefix = "", output = {}) {
    for (const [key, value] of Object.entries(input)) {
        const nextKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
            flattenObject(value, nextKey, output);
            continue;
        }
        output[nextKey] = value;
    }
    return output;
}

function walk(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const results = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            if (["node_modules", "dist", "locales"].includes(entry.name)) {
                continue;
            }
            results.push(...walk(fullPath));
            continue;
        }

        if (!sourceExtensions.has(path.extname(entry.name))) {
            continue;
        }

        if (/\.test\./i.test(entry.name)) {
            continue;
        }

        results.push(fullPath);
    }

    return results;
}

function collectTranslationKeys(content) {
    const usedKeys = new Set();
    const patterns = [
        /\bt\(\s*["'`]([^"'`]+)["'`]/g,
        /\bi18next\.t\(\s*["'`]([^"'`]+)["'`]/g,
        /\bi18nKey=\s*["'`]([^"'`]+)["'`]/g,
    ];

    for (const pattern of patterns) {
        for (const match of content.matchAll(pattern)) {
            usedKeys.add(match[1]);
        }
    }

    return usedKeys;
}

function looksLikeUserFacingText(text) {
    const value = text.trim();
    if (!value || value.length < 3) return false;
    if (/^[a-z0-9_.:/#-]+$/i.test(value)) return false;
    if (/^[A-Z0-9_\- ]+$/.test(value)) return false;
    if (/^(https?:|\/api\/|\/[a-z]|[A-Z]:\\)/i.test(value)) return false;
    if (/^[#.%0-9\s-]+$/.test(value)) return false;
    return /[A-Za-z\u00C0-\u1EF9]/.test(value);
}

function shouldIgnoreHardcodedText(text) {
    const normalized = text.trim();
    const whitelist = new Set([
        "CSV",
        "PDF",
        "Excel",
        "VND",
        "USD",
        "OWNER",
        "ADMIN",
        "MEMBER",
        "INCOME",
        "EXPENSE",
        "TRANSFER",
        "Junkio Finance",
        "Color",
        "Menu",
        "POST",
        "GET",
        "PUT",
        "DELETE",
    ]);

    if (whitelist.has(normalized)) return true;
    if (/^\+\d+k$/i.test(normalized)) return true;
    return false;
}

function addIssue(filePath, lineNumber, reason, text) {
    issueLines.push({
        file: path.relative(rootDir, filePath).replace(/\\/g, "/"),
        line: lineNumber,
        reason,
        text: text.trim(),
    });
}

function scanHardcodedText(filePath, content) {
    const lines = content.split(/\r?\n/);
    const callPattern = /\b(?:toast\.\w+|window\.confirm|window\.alert)\(\s*["'`]([^"'`]+)["'`]/g;
    const attrPattern = /\b(?:title|placeholder|aria-label|defaultValue)\s*[:=]\s*["'`]([^"'`]+)["'`]/g;
    const jsxTextPattern = />\s*([^<{][^<]{2,}?)\s*</g;
    const stripInterpolations = (value) => value.replace(/\{.*\}/g, " ").replace(/\s+/g, " ").trim();

    lines.forEach((line, index) => {
        for (const match of line.matchAll(callPattern)) {
            const text = match[1];
            if (looksLikeUserFacingText(text) && !shouldIgnoreHardcodedText(text)) {
                addIssue(filePath, index + 1, "hardcoded-call", text);
            }
        }

        for (const match of line.matchAll(attrPattern)) {
            const text = match[1];
            if (looksLikeUserFacingText(text) && !shouldIgnoreHardcodedText(text)) {
                addIssue(filePath, index + 1, "hardcoded-attr", text);
            }
        }

        for (const match of line.matchAll(jsxTextPattern)) {
            const text = stripInterpolations(match[1]);
            if (!looksLikeUserFacingText(text)) {
                continue;
            }
            if (line.includes("{t(") || line.includes("t('") || line.includes('t("') || line.includes("t(`")) {
                continue;
            }
            if (!shouldIgnoreHardcodedText(text)) {
                addIssue(filePath, index + 1, "hardcoded-jsx", text);
            }
        }
    });
}

const viKeys = flattenObject(readJson(viPath));
const enKeys = flattenObject(readJson(enPath));

const viSet = new Set(Object.keys(viKeys));
const enSet = new Set(Object.keys(enKeys));

const missingInEn = [...viSet].filter((key) => !enSet.has(key)).sort();
const missingInVi = [...enSet].filter((key) => !viSet.has(key)).sort();

const sourceFiles = walk(srcDir);
const usedKeys = new Set();

for (const filePath of sourceFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    for (const key of collectTranslationKeys(content)) {
        usedKeys.add(key);
    }
    scanHardcodedText(filePath, content);
}

const missingUsedKeys = [...usedKeys]
    .filter((key) => !viSet.has(key) || !enSet.has(key))
    .sort();

if (missingInEn.length > 0) {
    console.error("Missing keys in en locale:");
    missingInEn.forEach((key) => console.error(`  - ${key}`));
}

if (missingInVi.length > 0) {
    console.error("Missing keys in vi locale:");
    missingInVi.forEach((key) => console.error(`  - ${key}`));
}

if (missingUsedKeys.length > 0) {
    console.error("Translation keys used in source but missing in locale files:");
    missingUsedKeys.forEach((key) => console.error(`  - ${key}`));
}

if (issueLines.length > 0) {
    console.error("Suspicious hardcoded UI text:");
    issueLines.forEach((issue) => {
        console.error(`  - ${issue.file}:${issue.line} [${issue.reason}] ${issue.text}`);
    });
}

if (missingInEn.length === 0 && missingInVi.length === 0 && missingUsedKeys.length === 0 && issueLines.length === 0) {
    console.log("i18n audit passed: locale parity and hardcoded text checks are clean.");
    process.exit(0);
}

process.exit(1);
