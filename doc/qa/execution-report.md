# Junkio QA Execution Report

## Environment
- Workspace: `D:/Junkio-Expense-Tracker`
- Date: 2026-03-23
- Runtime: Docker (`db`, `redis`, `api`, `web`)
- Browser target: Chromium desktop + mobile emulation

## Commands Run

### Baseline and regression
- `docker compose up -d --build api web`
- `docker compose ps`
- `npm --prefix backend run test:smoke`
- `npm --prefix backend run test:newman`
- `npm --prefix backend run check:admin`
- `npm --prefix frontend run lint`
- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- `npm --prefix frontend run test:i18n`
- `npm --prefix frontend run test:e2e`
- `npm --prefix frontend run test:qa`

## Current Result Snapshot

| Area | Result | Notes |
| --- | --- | --- |
| Docker health | Pass | `db`, `redis`, `api`, `web` all up; `api`, `db`, `redis` healthy |
| Backend smoke | Pass | `tests/auth.test.js` and `tests/transaction.test.js` passed |
| Backend Newman | Pass | 9 requests, 17 assertions, 0 failures |
| Admin API check | Pass | `npm --prefix backend run check:admin` returned `OK` |
| Frontend lint | Pass | ESLint passed; Babel deopt warning on embedded font asset only |
| Frontend unit/integration | Pass | 8 test files passed, 19 tests passed, 2 skipped |
| Frontend build | Pass with warnings | Build succeeds; large chunk warnings remain for export/font bundles |
| i18n static audit | Pass | Locale parity and hardcoded text audit are clean |
| E2E desktop smoke | Pass | Admin, auth, finance, language, and runtime text audits passed |
| E2E mobile smoke | Pass | Mobile navigation smoke passed |
| Aggregate QA gate | Pass | `npm --prefix frontend run test:qa` completed successfully |

## Fixes Verified In This Run
- Vietnamese runtime text is rendered cleanly on dashboard, wallets, transactions, goals, settings, and admin screens.
- Family creation now refetches source-of-truth data and the new family is available for context switching in the UI.
- Wallet creation now preserves family scope when the user is in family context.
- Goal deposit modal now excludes family wallets for personal goals.
- Browser QA helpers now preserve SPA family context instead of forcing full reloads mid-flow.
- QA helper API calls now read the correct auth token key (`auth_token`).

## Runtime Evidence
- Playwright HTML report: `D:/Junkio-Expense-Tracker/output/playwright/report/index.html`
- Playwright traces/videos: `D:/Junkio-Expense-Tracker/output/playwright/test-results`

## Release Gate Decision
- Decision: Pass
- Reason:
  - `npm --prefix frontend run test:i18n` passes.
  - `npm --prefix frontend run test:e2e` passes 7/7.
  - `npm --prefix frontend run test:qa` passes end-to-end.
  - Backend smoke, Newman, and admin checks all pass.

## Residual Risks
- Frontend build still emits large chunk warnings for `Roboto-Regular-normal`, `index`, `xlsx`, and `jspdf` bundles.
- These warnings do not block the current QA gate, but bundle-size optimization is still worth a follow-up pass.

## Command Results
- `docker compose ps` -> pass
- `npm --prefix backend run test:smoke` -> pass
- `npm --prefix backend run test:newman` -> pass
- `npm --prefix backend run check:admin` -> pass
- `npm --prefix frontend run lint` -> pass
- `npm --prefix frontend test` -> pass
- `npm --prefix frontend run build` -> pass with chunk warnings
- `npm --prefix frontend run test:i18n` -> pass
- `npm --prefix frontend run test:e2e` -> pass
- `npm --prefix frontend run test:qa` -> pass

## Notes
- `D:/Junkio-Expense-Tracker/frontend/transactions_2026-03-22.pdf` was removed from the release set as a generated runtime export.
- `.gitignore` now excludes runtime transaction exports and browser-test output from future release commits.
- Release runbook is documented in `D:/Junkio-Expense-Tracker/doc/qa/release-checklist.md`.
