# Submission — Mini ERP + CRM Operations Portal

> Fill in the bracketed placeholders below once deployed (see `DEPLOYMENT.md` for the exact steps to get each link), then this file becomes your submission.

## 1. Links

| Item | Link |
|---|---|
| GitHub repository | `[ https://github.com/<your-username>/<repo-name> ]` |
| Live frontend URL | `[ https://<your-app>.vercel.app ]` |
| Live backend API URL | `[ https://<your-app>.onrender.com ]` |
| Database | Railway MySQL (internal — not publicly exposed, connected via `DATABASE_URL`) |

## 2. Test Login Credentials

Password for all seeded accounts: **`Password@123`**

| Role | Email |
|---|---|
| Admin | `admin@erp.test` |
| Sales | `sales@erp.test` |
| Warehouse | `warehouse@erp.test` |
| Accounts | `accounts@erp.test` |

## 3. API Documentation

Postman collection: `Mini-ERP-CRM.postman_collection.json` (in repo root). Import into Postman, run **Auth → Login** first — it auto-saves the JWT for every other request in the collection.

## 4. How the Server Was Set Up

- **Backend:** Node.js + TypeScript + Express, with Prisma as the ORM against MySQL. Routes are layered as `routes → controller (HTTP only) → service (business logic + DB access)`.
- **Auth:** JWT-based, 4 roles (Admin, Sales, Warehouse, Accounts) enforced via `authenticate` + `authorize(...roles)` middleware on each route.
- **Validation:** Zod schemas validate every request body/query/params before it reaches business logic; failures return `422` with field-level messages.
- **Error handling:** a single global error handler converts Zod errors, Prisma errors (unique constraint, not-found), and custom `AppError`s into a consistent JSON shape.
- **Stock integrity:** every change to `currentStock` happens inside a DB transaction that also writes an audit row to `StockMovement` — so the running total and the audit log can never drift apart. Challan confirmation validates stock for every line item before deducting any of them (all-or-nothing).
- **Deployment:** backend on Render (Node web service, free tier), frontend on Vercel (static Vite build), database on Railway (managed MySQL, free tier). See `DEPLOYMENT.md` for the exact steps.

## 5. How Environment Variables Are Managed

- Both `backend/` and `frontend/` ship a `.env.example` documenting every required variable — never a real `.env`.
- Locally: copy `.env.example` → `.env` and fill in values.
- In production: variables are set directly in the Render / Vercel dashboards (not committed to git). `JWT_SECRET` is generated fresh per environment, never reused between local and production.
- `backend/.gitignore` and `frontend/.gitignore` both exclude `.env`.

## 6. How to Run the Project Locally

```bash
# 1. Start MySQL (Docker)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env      # edit DATABASE_URL if not using the Docker defaults
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev                # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env       # VITE_API_URL=http://localhost:5000 is already correct for local
npm install
npm run dev                # http://localhost:5173
```

Full detail in the main `README.md`.

## 7. How to Deploy the Project

Full step-by-step in `DEPLOYMENT.md`. Summary: push to GitHub → provision MySQL on Railway → deploy `backend/` to Render (auto-detects `render.yaml`) → deploy `frontend/` to Vercel with `VITE_API_URL` pointing at the Render URL → set `FRONTEND_URL` on Render to the Vercel URL for CORS.

## 8. Architecture

See "Architecture Overview" in `README.md` for the full write-up. Short version: layered Express backend (routes/controllers/services) talking to MySQL through Prisma, a React + TypeScript frontend using Context for auth state and Axios with a JWT interceptor, role-based access control enforced server-side on every write route, and an audit-first design for anything touching stock (every quantity change is a transaction that also writes a `StockMovement` row).

## 9. Assumptions Made

1. **Follow-up notes** are modeled as a list (many timestamped, attributed entries per customer) rather than a single overwritable text field — matches "add follow-up notes" as an ongoing activity log better than a single field would.
2. **Cancelling a Confirmed challan restores stock.** Not explicit in the spec, but implied by "Confirmed = stock committed" — the reverse action should release it back. Fully audited via a `StockMovement` row.
3. **Challan numbers** are generated as `CH-{year}-{zero-padded id}`, derived from the database's own auto-increment id — guaranteed unique with no race condition.
4. **Editing challan items is only allowed while Draft.** Once Confirmed or Cancelled, line items are locked to keep the historical record trustworthy.
5. **Public self-signup is allowed for Sales/Warehouse/Accounts roles only.** Admin accounts cannot be created through public signup — they're created via the seed script, or by an existing Admin through the separate `/auth/register` endpoint. This was a deliberate late addition (not in the original spec, which only required login) to make the demo/reviewer experience easier — but it's restricted so a public signup can never grant itself Admin access.
6. **Challan confirmation** is allowed for Sales, Warehouse, and Admin roles — either the person who raised the challan or the warehouse floor fulfilling it might confirm. Adjust `authorize(...)` in `challans.routes.ts` if your actual approval flow differs.

## 10. Known Limitations / Not Implemented

- No automated test suite — effort went into correctness of the core business logic (stock transactions) over test coverage, given the 48h scope.
- No PDF invoice export, S3 image upload, or GitHub Actions CI/CD (all listed as bonus items in the spec, not required).
- No password-reset flow.
- Render's free tier cold-starts after inactivity (~30-60s wake time on first request after idling) — expected free-tier behavior, not a bug.
