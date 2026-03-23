# Junkio QA Bug Log

## Severity Guide
- `P0`: application unusable / data corruption / cannot demo
- `P1`: critical user flow broken / dead CTA / wrong business result
- `P2`: text, i18n, feedback, or UX issues that materially reduce usability
- `P3`: polish / non-blocking visual debt

## Open Findings

| Severity | Area | Finding | Evidence | Status |
| --- | --- | --- | --- | --- |
| P3 | Build performance | Frontend build still emits large-chunk warnings for `Roboto-Regular-normal`, `index`, `xlsx`, and `jspdf` bundles. | `npm --prefix frontend run build` output; `npm --prefix frontend run test:qa` output | Open |

## Closed Findings In This Cycle

| Severity | Area | Finding | Resolution | Status |
| --- | --- | --- | --- | --- |
| P1 | Family / Finance smoke | Family context flow was unreliable in browser smoke because family creation/state refresh and SPA navigation were not stable. | Family flow now refetches after create, family cards have stable selectors, and QA helpers preserve SPA context during wallet creation. | Closed |
| P1 | Wallet family scope | Wallets created from family context were missing `family_id`, so downstream flows treated family wallets as personal wallets. | `WalletForm` now sends `family_id` from `activeFamilyId` when creating a wallet in family context. | Closed |
| P2 | Runtime i18n / encoding | Vietnamese runtime screens and admin views showed mojibake / false-positive runtime artifact failures. | User-facing strings were moved through i18n, runtime artifact detection was hardened, and the smoke audit now passes on all covered VI screens. | Closed |
| P2 | Locale coverage | English locale parity and missing translation-key coverage failed the static audit. | Missing locale keys and hardcoded strings in the audited paths were added/removed; `test:i18n` now passes. | Closed |
| P2 | Goal deposit wallet filter | Goal deposit modal allowed family wallets to appear in personal-goal funding choices. | Deposit modal now filters on `family_id` correctly and browser smoke verifies the family wallet is absent. | Closed |
| P2 | QA auth helper | QA API verification requests used the wrong localStorage token key and produced false 401s. | E2E helper now reads `auth_token`, matching the app auth layer. | Closed |

## Validation Notes
- `npm --prefix frontend run test:i18n` passes.
- `npm --prefix frontend run test:e2e` passes 7/7.
- `npm --prefix frontend run test:qa` passes.
- Backend smoke, Newman, and admin checks all pass in the same QA cycle.
- The remaining `P3` build warning is accepted for the current release gate and tracked as follow-up optimization work.
