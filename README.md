# Junkio Expense Tracker

Junkio is a full-stack personal and family finance tracker.

## Stack
- Frontend: React 19, Vite, Redux Toolkit, Tailwind CSS, i18next
- Backend: Node.js 18, Express, Sequelize, Socket.IO
- Data: PostgreSQL, Redis
- Testing: Jest, Newman, Vitest, Playwright

## Core Capabilities
- Authentication with access token + refresh cookie
- Personal and family wallets
- Income, expense, transfer, import, and export flows
- Budgets and goals
- Notifications and admin dashboard
- Vietnamese and English UI

## Quick Start With Docker
This is the fastest way to run the full stack locally.

```bash
docker compose up -d db redis api web
docker compose ps
```

App endpoints:
- Web: `http://localhost`
- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/api-docs`

Notes:
- The API container runs migrations on startup.
- Demo seed data is enabled in the compose setup with `AUTO_SEED=true`.
- Placeholder secrets in `docker-compose.yml` are for local development only. Use real secrets from environment variables outside local dev.

## Local Development
### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Required Environment Variables
Backend expects these values to be present in `.env` or container environment:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `VITE_FRONTEND_URL`

Use strong secrets. Do not commit real `.env` files.

## Demo Accounts
The seeded local environment provides:
- `admin@junkio.com / admin123`
- `staff@junkio.com / staff123`
- `demo@junkio.com / demo123`

## API and QA Workflows
### Backend regression
```bash
npm --prefix backend run test:smoke
npm --prefix backend run test:newman
npm --prefix backend run check:admin
```

### Frontend regression
```bash
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run test:i18n
npm --prefix frontend run test:e2e
npm --prefix frontend run test:qa
```

### Full release gate
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

## QA Evidence
Release QA artifacts are tracked in:
- `doc/qa/test-matrix.md`
- `doc/qa/execution-report.md`
- `doc/qa/bug-log.md`
- `doc/qa/release-checklist.md`

## API Docs and Collections
- Swagger UI: `http://localhost:5000/api-docs`
- Postman collection: `doc/Junkio.postman_collection.json`
- Postman environment: `doc/Junkio.postman_environment.json`

## Repository Hygiene
Generated browser/test artifacts and runtime exports are intentionally excluded from release commits, including:
- Playwright output and test reports
- Runtime transaction exports such as `frontend/transactions_*.pdf`

## Known Residual Risk
Frontend builds still emit large chunk warnings for export-related bundles (`xlsx`, `jspdf`, embedded font assets). This is not a release blocker for the current QA gate, but it remains a follow-up optimization task.
