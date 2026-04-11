# Checklist Kiem Thu Cuoi

Ngay test: `2026-04-11`  
Base commit: `62ce9794c7257532ee969542b830a40cd9dae1bf`  
Trang thai workspace duoc test: local workspace hien tai, bao gom cac ban sua blocker chua commit.  
Moi truong: Docker local, `AUTO_SEED=true`, seed `admin/staff/demo`, health `http://localhost`, `http://localhost:5000/health`, `http://localhost:5000/api-docs` deu song.

## Automation Gate

| Hang muc | Ket qua | Bang chung | Ghi chu |
| --- | --- | --- | --- |
| Docker reset + health check | PASS | [environment-health.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/environment-health.log) | `db`, `api`, `redis` deu `up`; frontend va API da duoc smoke test lai qua Playwright va API UAT |
| Backend lint | PASS | [backend-lint.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/backend-lint.log) | Rerun tren code backend moi nhat |
| Backend test suite | PASS | [backend-test.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/backend-test.log) | Full suite pass sau khi sua debt flow va reset password |
| Backend docs build | PASS | [backend-docs-build.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/backend-docs-build.log) | Swagger/Postman sinh thanh cong |
| Backend admin smoke | PASS | [backend-check-admin.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/backend-check-admin.log) | RBAC admin on dinh |
| Newman compatibility smoke | PASS | [backend-test-newman.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/backend-test-newman.log) | Smoke/compatibility check, khong dung mot minh de sign-off |
| Frontend lint | PASS | [frontend-lint.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/frontend-lint.log) | Khong co blocker |
| Frontend unit/integration test | PASS | [frontend-test.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/frontend-test.log) | Bao gom regression test cho `Family.jsx` |
| Frontend build | PASS | [frontend-build.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/frontend-build.log) | Build production on dinh |
| Frontend i18n check | PASS | [frontend-test-i18n.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/frontend-test-i18n.log) | Da bo sung `common.total`, `export.records`, `export.sheetTransactions`, `export.sheetReport` |
| Playwright discovery | PASS | [frontend-playwright-list.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/frontend-playwright-list.log) | Nhan dien du 7 test |
| Playwright E2E smoke | PASS | [frontend-test-e2e.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/frontend-test-e2e.log) | `7/7` pass, mobile navigation da xanh |

## UAT Va API-Driven

| Actor / Module | Ket qua | Bang chung | Ghi chu |
| --- | --- | --- | --- |
| Khach: API protected bi chan | PASS | [api-uat-signoff.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff.log) | `/users/me` va `/admin/dashboard` tra `401` |
| Khach: route bao ve, session reload, logout | PASS | [frontend-test-e2e.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/frontend-test-e2e.log) | Co coverage o `auth.spec.js` va `admin.spec.js` |
| Dang ky validation co ban | PASS | [api-uat-signoff.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff.log) | Payload loi bi chan `422` |
| Member: profile, avatar, doi mat khau | PASS | [api-uat-signoff.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff.log) | Re-login bang mat khau moi thanh cong |
| Wallet: create/update/delete + duplicate-name guard | PASS | [api-uat-signoff.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff.log) | CRUD ca nhan va chan ten trung on |
| Transaction: create/detail/filter/delete/transfer/import/export | PASS | [api-uat-signoff.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff.log) | So du vi khop ky vong sau chuoi nghiep vu |
| Recurring CRUD | PASS | [api-uat-signoff.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff.log) | Tao, tam dung, bat lai, xoa deu on |
| Goals: create + deposit | PASS | [api-uat-signoff.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff.log) | `goal.currentAmount` va `wallet.balance` cap nhat dung |
| Reports / Analytics / Forecast | PASS | [api-uat-signoff.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff.log) | Dashboard, reports va forecast tra du lieu dung |
| Family: create + add member | PASS | [api-uat-signoff.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff.log) | Family rerun tao va them member thanh cong |
| Family: shared expense -> pending debt -> approve/reject/settle | PASS | [api-uat-signoff.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff.log) | Da verify lai end-to-end sau khi fix validator, `shareId` va family scoping |
| Budgets: personal/family + alert | PASS | [api-uat-signoff-continuation.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff-continuation.log) | Tao budget va sinh budget notification thanh cong |
| Staff: bi chan khoi admin | PASS | [api-uat-signoff.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff.log) | API admin tra `403` |
| Admin: dashboard, user detail, role change, lock/unlock, logs | PASS | [api-uat-signoff-continuation.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff-continuation.log) | RBAC va audit log hoat dong |
| Notifications: broadcast + read/read-all | PASS | [api-uat-signoff-continuation.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff-continuation.log) | Broadcast toi member va thao tac doc on |
| Forgot password + reset password | PASS | [api-uat-signoff-continuation.log](/D:/Junkio-Expense-Tracker/docx/08-kiem-thu-cuoi/logs/api-uat-signoff-continuation.log) | Da verify qua Ethereal preview, reset token, login bang mat khau moi va cleanup user test |

## Ket Luan Nhanh

Ket qua hien tai la `Ready to submit`.

Tat ca hang muc `Critical` da pass:

- Health stack
- Login/logout va guest protection
- Wallet core flow
- Transaction core flow
- Family debt flow
- Goal deposit flow
- Admin RBAC
- Backend full test suite
- Frontend build
- Docs build
- Playwright smoke
