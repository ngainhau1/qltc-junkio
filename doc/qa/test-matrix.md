# Junkio QA Test Matrix

## Scope
- Runtime target: Docker stack (`db`, `redis`, `api`, `web`)
- Locales: Vietnamese full pass, English smoke pass
- Devices: Chromium desktop + mobile emulation
- Roles: guest, member, staff, admin

## Automation Coverage

| Layer | Tool / Script | Scope | Expected Outcome |
| --- | --- | --- | --- |
| Backend API regression | `npm --prefix backend run test:smoke` | Core API smoke | Core endpoints return expected status/data |
| Backend admin regression | `npm --prefix backend run check:admin` | Admin-only API routes | Admin API remains callable and RBAC-safe |
| Frontend unit/integration | `npm --prefix frontend test` | Slice/component/service regressions | Existing FE integration stays green |
| Frontend static audit | `npm --prefix frontend run test:i18n` | Locale parity + hardcoded text scan | No missing keys, no suspicious hardcoded UI text |
| Frontend browser smoke | `npm --prefix frontend run test:e2e` | Auth, finance, admin, i18n, mobile smoke | Main end-user flows complete in browser |
| Frontend release smoke | `npm --prefix frontend run test:qa` | Combined FE + backend smoke | Single command for release gate |

## Manual UX Matrix

Status legend:
- `Pass (smoke)`: covered by the current automated/browser smoke suite
- `Pending expansion`: not yet covered deeply enough for a stronger manual sign-off
- `Gap`: intentionally outside the current release gate and should be expanded later

| Area | Role | Page / Route | Actions | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Auth | Guest / Member | `/login`, `/wallets` | Redirect guest to login, login, reload persistence, logout | `frontend/e2e/auth.spec.js`, `backend/tests/auth.test.js` | Pass (smoke) |
| Dashboard | Member | `/` | Initial load and runtime text audit on the main dashboard route | `frontend/e2e/i18n.spec.js` | Pass (smoke) |
| Wallets | Member | `/wallets` | Create personal wallet, reject duplicate name, verify wallet state via API | `frontend/e2e/finance.spec.js` | Pass (smoke) |
| Transactions | Member | Global modal + `/transactions` | Create expense, transfer, verify wallet balances via API | `frontend/e2e/finance.spec.js`, `backend/tests/transaction.test.js` | Pass (smoke) |
| Goals | Member | `/goals` | Create goal, deposit from personal wallet, reject family wallet source in UI | `frontend/e2e/finance.spec.js`, `backend/tests/goals.test.js` | Pass (smoke) |
| Families | Member | `/family` | Create family, activate context, create family wallet, switch back to personal | `frontend/e2e/finance.spec.js` | Pass (smoke) |
| Reports | Member | `/reports` | Charts render, export action, summaries reflect mutations | No dedicated browser smoke in current gate | Pending expansion |
| Settings / i18n | Member | `/settings` | Language switch, reload persistence, runtime text audit | `frontend/e2e/i18n.spec.js` | Pass (smoke) |
| Notifications | Member / Admin | Header bell | Broadcast, realtime arrival, mark read, unread count | API and slice coverage exist, but no dedicated browser smoke in current gate | Pending expansion |
| Staff RBAC | Staff | `/admin` + business pages | Staff is blocked from admin routes | `frontend/e2e/admin.spec.js`, `backend/scripts/admin-check.js` | Pass (smoke) |
| Admin | Admin | `/admin` | Overview loads, logs tab responds, runtime text audit stays clean | `frontend/e2e/admin.spec.js`, `backend/scripts/admin-check.js` | Pass (smoke) |
| Responsive | Member | Core pages on mobile emulation | Bottom nav and menu navigation stay usable on mobile viewport | `frontend/e2e/i18n.spec.js` (`@mobile`) | Pass (smoke) |
| Accessibility smoke | All | Core pages | Keyboard focus, label-input mapping, modal focus, aria on icon buttons | Partial coverage from FE tests; no dedicated end-to-end a11y sweep yet | Pending expansion |

## Release Gate

Release is considered stable only when:
- No `P0` or `P1` issues remain in `doc/qa/bug-log.md`
- `npm --prefix backend run test:smoke` passes
- `npm --prefix backend run test:newman` passes
- `npm --prefix backend run check:admin` passes
- `npm --prefix frontend run lint` passes
- `npm --prefix frontend test` passes
- `npm --prefix frontend run build` passes
- `npm --prefix frontend run test:i18n` passes
- `npm --prefix frontend run test:e2e` passes
- Vietnamese runtime smoke is clean: no raw i18n keys, no `undefined/null`, no broken primary CTAs
- English smoke is clean on auth, dashboard, wallets, transactions, goals, admin
