# Junkio Release Checklist

## Scope
This checklist is the final release-hardening pass after the QA gate turned green.

## Repository Hygiene
- [x] Keep product fixes in the release set.
- [x] Keep QA assets in the release set.
- [x] Exclude generated browser artifacts from commits.
- [x] Exclude runtime export artifacts from commits.
- [x] Remove `frontend/transactions_2026-03-22.pdf` from the release set.
- [x] Ignore future runtime exports with `frontend/transactions_*.pdf`, `frontend/transactions_*.csv`, and `frontend/transactions_*.xlsx`.

## Commands To Run Before Merge
```bash
docker compose ps
npm --prefix backend run test:smoke
npm --prefix backend run test:newman
npm --prefix backend run check:admin
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run test:i18n
npm --prefix frontend run test:e2e
npm --prefix frontend run test:qa
```

## Expected Outcome
- Docker services are up and healthy.
- Backend smoke, Newman, and admin checks pass.
- Frontend lint, unit/integration, build, i18n audit, E2E, and aggregate QA gate pass.
- No `P0` or `P1` issues remain in `doc/qa/bug-log.md`.
- No generated artifacts are included in the release commit.

## Release Notes Draft
- QA gate passes end to end across backend, frontend, i18n, and browser smoke.
- Family context flow is stable for create family, switch context, and create family wallet.
- Goal deposit only allows valid personal-wallet funding sources.
- Runtime text and i18n coverage are clean on the audited screens.
- QA automation can be rerun with the documented commands in this repository.

## Residual Risk
- Frontend build still warns about large export-related bundles.
- Bundle-size optimization is deferred to the next follow-up cycle.
