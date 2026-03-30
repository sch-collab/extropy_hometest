# Expense Tracker Monorepo

A full-stack expense tracker using a `pnpm` workspace.

## Stack
- Frontend: React + TypeScript + Vite + MUI + React Query + Zustand
- Backend: AWS Lambda + API Gateway + TypeScript + Serverless Framework
- Database: DynamoDB
- Auth: JWT (email/password)
- Testing: Jest unit tests for backend critical logic

## Project structure
- `packages/backend`: Lambda handlers, validation, business services, DynamoDB resources
- `packages/frontend`: UI, route protection, API clients, reporting dashboard

## Architecture
1. Frontend sends REST requests to API Gateway.
2. API Gateway invokes Lambda handlers.
3. Handlers validate inputs (`zod`) and authenticate JWT for protected routes.
4. Services perform read/write operations in DynamoDB:
   - `Users` with `EmailIndex`
   - `Expenses` with `UserDateIndex`
   - `Categories`
5. Reporting endpoint aggregates monthly total and category breakdown.

## One-command setup
From repo root:

```bash
pnpm install
# create .env files (see below)
pnpm run build
pnpm run dev
```

## Environment files
### `packages/backend/.env`
```bash
AWS_REGION=us-east-1
JWT_SECRET=replace-with-a-long-random-secret
USERS_TABLE=Users
EXPENSES_TABLE=Expenses
CATEGORIES_TABLE=Categories
```

### `packages/frontend/.env`
```bash
VITE_API_BASE_URL=http://localhost:3001/dev
```

## API endpoints
Public:
- `POST /auth/signup`
- `POST /auth/login`

Private (Bearer token):
- `GET /expenses`
- `POST /expenses`
- `PUT /expenses/{id}`
- `DELETE /expenses/{id}`
- `GET /categories`
- `POST /categories`
- `DELETE /categories/{id}`
- `GET /reports/summary?month=YYYY-MM`

## Scripts
- `pnpm run dev`: frontend + backend locally
- `pnpm run build`: build/typecheck all packages
- `pnpm run test`: run workspace tests
- `pnpm run deploy`: deploy backend to AWS

## Deploy backend to AWS
1. Install and configure AWS CLI (`aws configure`).
2. Set backend `.env` values.
3. Run:
   ```bash
   pnpm run deploy
   ```
4. Copy deployed API URL and set it as `VITE_API_BASE_URL` for frontend.

## Notes
- Signup seeds default categories (Food, Transport, Entertainment, etc.).
- Backend uses `nodejs20.x` runtime.
- DynamoDB uses on-demand billing for free-tier-friendly development.
