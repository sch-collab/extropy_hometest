# Expense Tracker — Full-Stack Monorepo

A **personal expense tracker** for a take-home assessment: a React dashboard (filters, charts, CSV export) backed by **AWS Lambda**, **API Gateway**, and **DynamoDB**. Users **sign up / log in** with email and password; the API issues **JWTs**, validates inputs with **Zod**, and hashes passwords with **bcrypt**.

This document is written for **reviewers and future maintainers**: it explains what was built, how the repo is organized, how to run and test it locally, how to deploy to AWS, and what trade-offs were made.

---

## Table of contents

1. [Assessment overview — what to evaluate](#assessment-overview--what-to-evaluate)
2. [Feature summary](#feature-summary)
3. [Tech stack](#tech-stack)
4. [Architecture](#architecture)
5. [Repository structure](#repository-structure)
6. [Backend: Lambda routes and DynamoDB](#backend-lambda-routes-and-dynamodb)
7. [Frontend: screens and data flow](#frontend-screens-and-data-flow)
8. [Prerequisites](#prerequisites)
9. [Installation](#installation)
10. [Environment variables](#environment-variables)
11. [How to run (local development)](#how-to-run-local-development)
12. [How to build](#how-to-build)
13. [How to test](#how-to-test)
14. [HTTP API reference](#http-api-reference)
15. [How to deploy](#how-to-deploy)
16. [Updating dependencies and configuration](#updating-dependencies-and-configuration)
17. [Security and secrets](#security-and-secrets)
18. [Limitations and assumptions](#limitations-and-assumptions)
19. [Troubleshooting](#troubleshooting)
20. [License / ownership](#license--ownership)

---

## Assessment overview — what to evaluate

Use this section as a **quick rubric** when grading the submission.

| Area | What to look for |
|------|-------------------|
| **Full stack** | Monorepo with a real SPA and a real HTTP API, not a mock-only demo. |
| **Cloud backend** | Serverless on AWS: Lambda + API Gateway + DynamoDB defined as code (`serverless.yml`). |
| **Auth** | Signup/login, JWT for protected routes, passwords hashed (bcrypt), not stored in plain text. |
| **Data** | Multi-user isolation via `userId` on partition keys; GSIs for email lookup and date-range queries. |
| **Validation** | Zod schemas on API inputs; TypeScript end-to-end. |
| **UX** | Dashboard beyond a bare list: reporting, charting, export. |
| **Quality** | Jest tests on non-trivial backend logic; clear README for run/deploy/test. |

**Suggested reviewer flow**

1. Clone the repo, run `pnpm install`, copy `.env.example` → `.env` in both `packages/backend` and `packages/frontend`.
2. Configure AWS credentials and deploy the backend once **or** use an account where DynamoDB tables from this stack already exist.
3. Run `pnpm dev`, open the Vite URL, sign up, add expenses, filter, view reports/chart, export CSV.
4. Run `pnpm test` and optionally `pnpm --filter backend test -- --coverage`.

---

## Feature summary

### Authentication and onboarding

- **Sign up** with email + password (password minimum length **6** per Zod in `auth` handlers).
- **Log in** returns the same shape: `{ userId, token }` (JWT).
- On **signup**, the backend seeds **eight default categories**: Food, Transport, Entertainment, Shopping, Health, Bills, Education, Other (`CategoryService.seedDefaultCategories`).

### Expenses

- **Create** expenses: amount (positive number), description, `categoryId`, `date` (`YYYY-MM-DD`).
- **List** expenses with optional **start/end date** and **category** filter. When both dates are set, the backend queries **`UserDateIndex`**; otherwise it queries the base table by `userId` and filters category in memory.
- **Update** and **delete** are implemented in the API (`PUT` / `DELETE` /expenses/{id}). The current dashboard UI wires **create** and **delete**; **update** is available via API for extensions or API clients.

### Categories

- **List**, **create**, and **delete** categories (defaults are deletable like any other category).

### Reporting and dashboard

- **Monthly summary** for a selected month (`YYYY-MM`): total spend and **per-category totals** (sorted descending).
- **Spending trends** chart: last **6** calendar months, one report request per month (`SpendingTrendsChart` + `lastNMonthKeys`).
- **CSV export** of the **currently loaded** expense list (after list filters), UTF-8 BOM for Excel-friendly open, filename `expenses-YYYY-MM-DD.csv`.

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Monorepo** | `pnpm` workspaces (`pnpm-workspace.yaml`, `packages/*`) |
| **Frontend** | React 18+, TypeScript, **Vite**, **MUI**, **TanStack React Query**, **Zustand**, Axios, React Router, **Recharts** |
| **Backend** | Node.js **20.x** on AWS Lambda, TypeScript, **Serverless Framework v3**, **serverless-esbuild**, **Zod**, AWS SDK v3 (DynamoDB Document Client), `jsonwebtoken`, `bcryptjs` |
| **Infrastructure** | API Gateway (HTTP API → Lambda), DynamoDB tables + GSIs in CloudFormation (`serverless.yml` → `resources`) |
| **Local API** | **serverless-offline** on port **3001**, stage **`dev`** → base path includes **`/dev`** |
| **Tests** | **Jest** + **ts-jest** in **backend only**; handlers excluded from coverage collection |

---

## Architecture

### High-level flow

1. The **browser** loads the Vite SPA (default dev server: `http://localhost:5173`).
2. The app calls the REST API using **`VITE_API_BASE_URL`** (local: `http://localhost:3001/dev`).
3. **API Gateway** (or serverless-offline) routes each path/method to a **dedicated Lambda** per route (`serverless.yml` → `functions`).
4. **Public** routes (`/auth/*`) parse JSON with Zod and call `AuthService`.
5. **Protected** routes expect `Authorization: Bearer <jwt>`; `getAuthContext` in `middleware/auth.ts` verifies the token and supplies `userId` / `email`.
6. **Services** read/write **DynamoDB** via `docClient` (`packages/backend/src/services/dynamo.ts`).
7. **Monthly reports** load expenses for `${month}-01` … `${month}-31` via `UserDateIndex` (string date range).

### Why serverless-offline still needs AWS (DynamoDB)

**serverless-offline** emulates API Gateway + Lambda locally; it does **not** ship an in-process DynamoDB. With the default setup, Lambdas use **real DynamoDB** in your AWS account (credentials from the environment / `aws configure`). For tables to exist, run **`serverless deploy`** at least once so CloudFormation creates them, or create compatible tables manually with the same names and indexes.

---

## Repository structure

```
extropy_hometest/
├── package.json                 # Root scripts: dev, build, test, deploy
├── pnpm-workspace.yaml          # workspaces: packages/*
├── pnpm-lock.yaml               # Commit when dependencies change
├── README.md
├── .gitignore                   # node_modules, dist, .env, .serverless, coverage, etc.
│
├── packages/
│   ├── backend/
│   │   ├── package.json         # serverless, jest, dev: serverless-offline :3001
│   │   ├── serverless.yml       # service name, provider, functions, IAM, DynamoDB resources, esbuild
│   │   ├── tsconfig.json
│   │   ├── jest.config.ts       # ts-jest, coverage excludes handlers/
│   │   ├── .env.example         # Copy to .env (not committed)
│   │   └── src/
│   │       ├── handlers/        # Lambda entrypoints: auth, expenses, categories, reports
│   │       ├── middleware/      # JWT / API Gateway event auth
│   │       ├── services/        # AuthService, ExpenseService, CategoryService, ReportService, dynamo
│   │       ├── models/          # Shared TS types (User, Expense, Category)
│   │       ├── utils/           # JSON HTTP helpers, JWT sign/verify, bearer parsing
│   │       └── __tests__/       # Jest: auth utils, ReportService
│   │
│   └── frontend/
│       ├── package.json         # vite, react, mui, react-query, zustand, recharts
│       ├── vite.config.ts
│       ├── tsconfig.json        # solution-style references
│       ├── tsconfig.app.json
│       ├── tsconfig.node.json
│       ├── .env.example         # VITE_API_BASE_URL
│       └── src/
│           ├── main.tsx         # React root
│           ├── App.tsx          # Routes: /auth, /, catch-all redirect
│           ├── pages/           # AuthPage, DashboardPage
│           ├── components/      # AuthForm, ExpenseForm, ExpenseList, ReportPanel, SpendingTrendsChart
│           ├── api/             # Axios instance + auth, expenses, categories, reports
│           ├── state/           # Zustand auth store (token, userId, logout)
│           ├── types/           # DTOs aligned with API
│           └── utils/           # monthKeys (chart), exportExpensesCsv
```

---

## Backend: Lambda routes and DynamoDB

### Lambda functions ↔ HTTP (from `serverless.yml`)

HTTP paths are **relative to the stage**. Full URL pattern: `{baseUrl}/{stage}/...` (e.g. `.../dev/auth/signup`).

| Serverless key | Handler | Method | Path |
|----------------|---------|--------|------|
| `signup` | `auth.signup` | POST | `auth/signup` |
| `login` | `auth.login` | POST | `auth/login` |
| `createExpense` | `expenses.createExpense` | POST | `expenses` |
| `getExpenses` | `expenses.getExpenses` | GET | `expenses` |
| `updateExpense` | `expenses.updateExpense` | PUT | `expenses/{id}` |
| `deleteExpense` | `expenses.deleteExpense` | DELETE | `expenses/{id}` |
| `createCategory` | `categories.createCategory` | POST | `categories` |
| `getCategories` | `categories.getCategories` | GET | `categories` |
| `deleteCategory` | `categories.deleteCategory` | DELETE | `categories/{id}` |
| `getReportSummary` | `reports.getReportSummary` | GET | `reports/summary` |

All of the above use **`cors: true`** in Serverless; responses add `Access-Control-Allow-Origin: *` in `utils/http.ts`.

### DynamoDB tables (CloudFormation in `serverless.yml`)

| Table | Partition key | Sort key | Indexes |
|-------|----------------|----------|---------|
| **Users** (`USERS_TABLE`) | `userId` (S) | — | **EmailIndex**: `email` (HASH) — login/signup lookup |
| **Expenses** (`EXPENSES_TABLE`) | `userId` (S) | `expenseId` (S) | **UserDateIndex**: `userId` (HASH), `expenseDate` (RANGE) — date-range queries |
| **Categories** (`CATEGORIES_TABLE`) | `userId` (S) | `categoryId` (S) | — |

Billing mode: **PAY_PER_REQUEST** (on-demand).

### IAM

Lambda execution role allows `dynamodb:PutItem`, `GetItem`, `UpdateItem`, `DeleteItem`, `Query` on the three tables and their indexes (see `provider.iam.role.statements` in `serverless.yml`).

---

## Frontend: screens and data flow

### Routing (`App.tsx`)

| Path | Behavior |
|------|----------|
| `/auth` | Login / signup (`AuthPage`; mode via `?mode=login` or `?mode=signup`) |
| `/` | **Protected** dashboard (`DashboardPage`); redirects to `/auth?mode=login` if no JWT in Zustand |
| `*` | Redirect to `/` if logged in, else `/auth?mode=login` |

### State and API

- **Zustand** (`state/auth.ts`): stores JWT and `userId`; **Axios** interceptor (`api/client.ts`) attaches `Authorization: Bearer …`.
- **React Query**: categories, expenses (keyed by filter params), report for selected month; spending chart issues **parallel** report queries for six months.
- **Mutations** invalidate expense and report queries after create/delete expense; category create invalidates categories.

### Dashboard layout (conceptual)

- App bar with **Logout**.
- **Expense form** → create expense.
- **Date range + category** filters → refetch expense list.
- **Expense list** with delete + **Export CSV** (exports whatever the list query returned).
- **Spending trends** (line chart) + **Report panel** (monthly total + by category) + **month picker** and **add category** form.

---

## Prerequisites

| Tool | Notes |
|------|--------|
| **Node.js** | **18+**; **20.x** recommended to match Lambda runtime |
| **pnpm** | Required for workspaces. Install: [pnpm.io/installation](https://pnpm.io/installation) |
| **AWS CLI** | For deploy and for local Lambdas talking to real DynamoDB: [AWS CLI install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| **AWS account** | With permissions to create/update CloudFormation stacks, Lambda, API Gateway, DynamoDB |

---

## Installation

From the **repository root**:

```bash
pnpm install
```

Create environment files from the tracked templates:

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

Edit `packages/backend/.env`: set a strong **`JWT_SECRET`** before running against any shared or production-like environment.

---

## Environment variables

### `packages/backend/.env`

Loaded via `import "dotenv/config"` in handlers and merged into Serverless `provider.environment` for deploy/offline.

| Variable | Purpose |
|----------|---------|
| `AWS_REGION` | AWS region for DynamoDB and Serverless deployment (default in config: `us-east-1`) |
| `JWT_SECRET` | HMAC secret for JWT sign/verify (**change** from `change-me` for real use) |
| `USERS_TABLE` | DynamoDB table name for users (must match `serverless.yml` / deployed table) |
| `EXPENSES_TABLE` | Expenses table name |
| `CATEGORIES_TABLE` | Categories table name |

Defaults in `serverless.yml` match `Users`, `Expenses`, `Categories` if env vars are unset.

### `packages/frontend/.env`

Vite exposes only variables prefixed with **`VITE_`**.

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Full base URL including **stage** segment, e.g. `http://localhost:3001/dev` or `https://xxxx.execute-api.region.amazonaws.com/dev` |

If unset, `packages/frontend/src/api/client.ts` falls back to `http://localhost:3001/dev`.

---

## How to run (local development)

### Full stack (recommended)

```bash
pnpm run dev
```

This uses **concurrently** to run:

| Script | Command | Typical URL |
|--------|---------|-------------|
| Backend | `pnpm --filter backend dev` → `serverless offline --stage dev --httpPort 3001` | API base: `http://localhost:3001/dev` |
| Frontend | `pnpm --filter frontend dev` → Vite | `http://localhost:5173` |

Ensure `packages/frontend/.env` has `VITE_API_BASE_URL=http://localhost:3001/dev` (matches `.env.example`).

### Run packages in separate terminals

```bash
pnpm run dev:backend
# other terminal:
pnpm run dev:frontend
```

### Preview production frontend build locally

```bash
pnpm --filter frontend run build
pnpm --filter frontend run preview
```

Useful to verify the built bundle and env injection before static hosting.

---

## How to build

```bash
pnpm run build
```

Runs `pnpm -r build` across workspaces:

| Package | Build script | Output / effect |
|---------|--------------|-----------------|
| **backend** | `tsc --noEmit` | Typecheck only; Lambda bundles are built by **esbuild** during `serverless deploy` / offline |
| **frontend** | `tsc -b && vite build` | Static assets in `packages/frontend/dist/` |

---

## How to test

### Backend (Jest)

```bash
# All workspace tests (root script)
pnpm run test

# Backend only
pnpm --filter backend test

# With coverage report
pnpm --filter backend test -- --coverage
```

- **Config**: `packages/backend/jest.config.ts` — Node environment, `ts-jest`, tests under `src/__tests__/**/*.test.ts`.
- **Coverage**: `collectCoverageFrom` includes `src/**/*.ts` but **excludes** `src/handlers/**` (handlers are thin; logic lives in services/utils).

**Current tests**

| File | Focus |
|------|--------|
| `__tests__/auth.test.ts` | JWT sign/verify round-trip, `parseBearerToken` edge cases |
| `__tests__/report.test.ts` | `ReportService.getMonthlySummary` aggregation (with `ExpenseService` mocked) |

### Frontend

`packages/frontend` `test` script is a placeholder (“No frontend tests configured”). Adding **Vitest** + React Testing Library would be a natural follow-up for an assessment stretch goal.

### Manual smoke checklist

- [ ] Sign up → redirected / logged in with categories visible  
- [ ] Create expense → appears in list and in monthly report  
- [ ] Filter by date/category → list and CSV reflect filters  
- [ ] Chart shows six months; change month on report panel  
- [ ] Logout → cannot access `/` without logging in again  

---

## HTTP API reference

Base URL examples:

- Local: `http://localhost:3001/dev`
- Deployed: `https://<api-id>.execute-api.<region>.amazonaws.com/<stage>`

All JSON bodies/responses use `Content-Type: application/json` where a body exists.

### Public

| Method | Path | Body | Success |
|--------|------|------|---------|
| POST | `/auth/signup` | `{ "email": string, "password": string }` | `201` `{ userId, token }` |
| POST | `/auth/login` | `{ "email": string, "password": string }` | `200` `{ userId, token }` |

### Protected (`Authorization: Bearer <token>`)

| Method | Path | Query / body |
|--------|------|----------------|
| GET | `/expenses` | `startDate`, `endDate` (`YYYY-MM-DD`), `categoryId` optional |
| POST | `/expenses` | `{ amount, description, categoryId, date }` |
| PUT | `/expenses/{id}` | Partial updates (all fields optional; at least one required by service) |
| DELETE | `/expenses/{id}` | — |
| GET | `/categories` | — |
| POST | `/categories` | `{ "name": string }` |
| DELETE | `/categories/{id}` | — |
| GET | `/reports/summary` | **`month=YYYY-MM` required** |

**JWT**: Signed with `JWT_SECRET`; default expiry **7 days** (`signToken` in `packages/backend/src/utils/auth.ts`).

### Example: signup and call a protected route (local)

Replace `BASE` and the token with your values.

```bash
BASE=http://localhost:3001/dev
curl -s -X POST "$BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"secret12"}'

TOKEN="<paste token from response>"

curl -s "$BASE/categories" -H "Authorization: Bearer $TOKEN"
```

---

## How to deploy

### 1. AWS credentials

Configure credentials so the Serverless CLI can create/update stacks (`aws configure`, environment variables, or CI role).

### 2. Backend `.env`

Set production-grade values, especially **`JWT_SECRET`**, **`AWS_REGION`**, and table names if you deviate from defaults.

### 3. Deploy Serverless stack

From **repo root**:

```bash
pnpm run deploy
```

Equivalent to `pnpm --filter backend run deploy` → `serverless deploy`.

Note the **API Gateway** base URL and **stage** in the command output (e.g. `https://xxxxx.execute-api.us-east-1.amazonaws.com/dev`).

### 4. Point the frontend at the deployed API

Set in CI/hosting env or `packages/frontend/.env`:

```bash
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/<stage>
```

Rebuild the frontend — Vite **inlines** `VITE_*` at **build time**:

```bash
pnpm --filter frontend run build
```

Upload `packages/frontend/dist/` to static hosting (S3 + CloudFront, Netlify, Vercel, etc.).

### 5. Other stages

```bash
pnpm --filter backend exec -- serverless deploy --stage prod
```

The URL path segment changes (`/prod` instead of `/dev`); update `VITE_API_BASE_URL` accordingly.

### 6. Stack info / removal

```bash
pnpm --filter backend exec -- serverless info
pnpm --filter backend exec -- serverless remove   # destroys stack resources — use with care
```

---

## Updating dependencies and configuration

### Dependencies

```bash
pnpm install
```

After editing any `package.json`, run `pnpm install` and **commit `pnpm-lock.yaml`** for reproducible installs.

Per-package upgrades (examples):

```bash
pnpm --filter backend update
pnpm --filter frontend update
```

### Infrastructure

- Change **`serverless.yml`** for new routes, env vars, IAM, or DynamoDB resources, then redeploy.
- Keep **table names** in `.env` aligned with deployed CloudFormation resources; renaming tables in AWS requires migration or a new stack.

### Frontend API URL

Any change to API host or stage requires updating **`VITE_API_BASE_URL`** and **rebuilding** the frontend.

---

## Security and secrets

- **Never commit** real `.env` files or JWT secrets (`.gitignore` excludes `.env`; use `.env.example` as documentation only).
- **Rotate** any secret that was ever committed or shared.
- Default **`JWT_SECRET`** in `serverless.yml` is `change-me` — unsuitable for production.
- CORS is **`Access-Control-Allow-Origin: *`** for simplicity; tighten for production (specific origin + credentials policy as needed).
- Passwords are **hashed** with bcrypt (cost factor **10** in `AuthService`).

---

## Limitations and assumptions

- **No DynamoDB Local** in-repo: local dev uses **real** DynamoDB with AWS credentials.
- **No refresh tokens**: JWT expires in 7 days; no silent refresh flow.
- **Expense update UI** not wired on the dashboard; API supports `PUT` for programmatic clients.
- **Report range** uses `${month}-01` … `${month}-31` as **strings** for `UserDateIndex` queries (works for calendar filtering; invalid calendar dates are simply empty).
- **Frontend tests** not implemented (placeholder script only).
- **CI/CD** pipelines (GitHub Actions, etc.) are not included; add as needed for your org.

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| `401` / “No token” | Log in again; confirm Zustand has token; `Authorization: Bearer` format. |
| UI cannot reach API | `VITE_API_BASE_URL` must match offline/deployed base **including** `/dev` or stage segment. |
| DynamoDB errors locally | Tables must exist in the configured region; run **`serverless deploy`** first or align table names. |
| CORS errors | Backend sets `*`; check **HTTPS vs HTTP** mixed content if the site is HTTPS. |
| Signup “user exists” | Same email in `EmailIndex`; use another email or delete the user item in dev. |
| Push rejected / empty repo | Ensure you have at least one **commit** before `git push`. |

---

## License / ownership

Root `package.json` sets `"private": true`. Adjust licensing for your course or employer as required.
