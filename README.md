# ERP — Mini ERP + CRM Operations Portal

A small internal ERP/CRM system for a wholesale/distribution company, covering customer CRM, product & inventory management, and a sales challan flow with stock control. Branded simply as **ERP** in the UI.

> Deploying? See `DEPLOYMENT.md` for step-by-step instructions and `SUBMISSION.md` for the final document to hand in (links, credentials, architecture, assumptions).

## Tech Stack

- **Backend:** Node.js, TypeScript, Express.js, Prisma ORM, MySQL, JWT auth, Zod validation
- **Frontend:** React + TypeScript (Vite), React Router, Axios
- **Deployment target:** Backend on Render/Railway, Frontend on Vercel/Netlify, DB on Railway/Aiven/PlanetScale-style managed MySQL (any free MySQL host)

---

## 1. Project Structure

```
mini-erp-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # DB schema (source of truth for tables)
│   │   └── seed.ts            # Creates 4 test users + sample customer/products
│   ├── src/
│   │   ├── app.ts             # Express app + middleware + route mounting
│   │   ├── server.ts          # Entry point
│   │   ├── config/db.ts       # Prisma client singleton
│   │   ├── middleware/        # auth, validate, errorHandler
│   │   ├── utils/             # AppError, asyncHandler, jwt helpers
│   │   └── modules/
│   │       ├── auth/          # login, register, me
│   │       ├── customers/     # CRM module
│   │       ├── products/      # inventory module
│   │       └── challans/      # sales challan module
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   └── src/
│       ├── api/client.ts      # Axios instance + JWT interceptor
│       ├── context/AuthContext.tsx
│       ├── components/        # Layout, ProtectedRoute
│       └── pages/              # Login, Dashboard, customers/, products/, challans/
├── docker-compose.yml          # Local MySQL + Adminer for quick setup
└── Mini-ERP-CRM.postman_collection.json
```

---

## 2. Local Setup

### Prerequisites
- Node.js 18+
- MySQL 8 (or Docker, see below)

### Step 1 — Start MySQL locally

**Option A: Docker (recommended, zero manual MySQL install)**
```bash
docker compose up -d
```
This starts MySQL on `localhost:3306` (user `root`, password `password`, db `mini_erp_crm`) and Adminer (a DB browser UI) on `http://localhost:8080`.

**Option B: Your own MySQL install**
Create a database manually:
```sql
CREATE DATABASE mini_erp_crm;
```

### Step 2 — Backend

```bash
cd backend
cp .env.example .env
# edit .env if your DB credentials differ from the docker-compose defaults

npm install
npx prisma migrate dev --name init   # creates all tables
npm run seed                          # creates test users + sample data
npm run dev                           # starts on http://localhost:5000
```

Seeded test accounts (password for all: `Password@123`):
| Role | Email |
|---|---|
| Admin | admin@erp.test |
| Sales | sales@erp.test |
| Warehouse | warehouse@erp.test |
| Accounts | accounts@erp.test |

### Step 3 — Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:5000 (default is already correct for local)

npm install
npm run dev             # starts on http://localhost:5173
```

Open `http://localhost:5173` and log in with any seeded account above.

### Step 4 — Verify with Postman (optional)
Import `Mini-ERP-CRM.postman_collection.json` into Postman. Run **Auth → Login** first — it auto-saves the JWT into the collection's `token` variable, which every other request reuses automatically.

---

## 3. Environment Variables

### Backend (`backend/.env`)
| Variable | Purpose |
|---|---|
| `PORT` | Port the API listens on (default 5000) |
| `DATABASE_URL` | MySQL connection string: `mysql://user:pass@host:port/db` |
| `JWT_SECRET` | Secret used to sign JWTs — **change this in production** |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `8h` |
| `FRONTEND_URL` | Used for CORS — set to your deployed frontend URL in production |

### Frontend (`frontend/.env`)
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

Secrets are never committed — both `.env` files are gitignored, and `.env.example` documents every variable a fresh clone needs.

---

## 4. How the Server Is Set Up

- Express app (`app.ts`) applies `helmet` (security headers), `cors` (scoped to `FRONTEND_URL`), and `morgan` (request logging) globally.
- Every route module (`auth`, `customers`, `products`, `challans`) is self-contained: `*.schema.ts` (Zod validation) → `*.service.ts` (business logic + Prisma calls) → `*.controller.ts` (thin HTTP layer) → `*.routes.ts` (wiring + role guards).
- `authenticate` middleware verifies the JWT and attaches `req.user`; `authorize(...roles)` restricts specific routes to specific roles.
- All errors funnel into one `errorHandler` — Zod validation errors become `422`s with field-level messages, Prisma known errors (unique constraint, not-found) become `409`/`404`, and everything else becomes a `500` without leaking internals.
- Prisma is used as the query layer instead of raw SQL for type safety and easy migrations — `prisma/schema.prisma` is the single source of truth for the DB schema, and `prisma migrate dev` generates/applies migrations from it.

---

## 5. Deployment Guide (free-tier hosting)

### Database — Railway / Aiven / any free MySQL
1. Create a MySQL instance, copy its connection string.
2. Set it as `DATABASE_URL` in your backend host's environment variables.

### Backend — Render / Railway / Fly.io
1. Push this repo to GitHub.
2. Create a new Web Service, root directory `backend/`.
3. Build command: `npm install && npx prisma generate && npm run build`
4. Start command: `npx prisma migrate deploy && npm start`
5. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `PORT` (most hosts inject `PORT` automatically).
6. After first deploy, run the seed script once (via the host's shell/console): `npm run seed`.

### Frontend — Vercel / Netlify
1. Root directory `frontend/`.
2. Build command: `npm install && npm run build`, output directory: `dist`.
3. Set environment variable `VITE_API_URL` to your deployed backend URL.

### Docker (bonus)
A `Dockerfile` is included in `backend/` — builds, generates the Prisma client, runs migrations, and starts the server on container boot. Useful for Fly.io or any container-based host.

---

## 6. Architecture Overview

- **Layered backend:** routes → controllers (HTTP only) → services (business logic, all Prisma access) → Prisma → MySQL. This keeps business rules (like stock validation) testable independent of Express.
- **Role-based access:** JWT carries `role`; each route declares which roles can call it via `authorize('ADMIN', 'SALES', ...)`. Read access is generally broad (any logged-in user can look up a customer or product); writes are scoped to the role that owns that data (Sales owns CRM/challans, Warehouse owns product/stock).
- **Data integrity for stock:** `currentStock` on a `Product` is only ever changed inside a single DB transaction that also writes a `StockMovement` row — so the log and the running total can never drift apart. Challan confirmation validates stock for **every** line item before deducting **any** of them (all-or-nothing), so a partial failure never leaves inventory in a half-applied state.
- **Snapshotting:** `ChallanItem` stores `productNameSnapshot`, `productSkuSnapshot`, and `unitPriceSnapshot` at the moment the challan is created — so if a product's price or name changes later, historical challans still show what was actually sold, not the current catalog value.
- **Frontend:** plain React Context for auth state (JWT + user stored in `localStorage`), Axios interceptor attaches the token to every request and auto-redirects to `/login` on a `401`. No heavy state library — the app is small enough that page-level `useState`/`useEffect` data fetching keeps things simple and readable.

---

## 7. Assumptions Made

1. **Follow-up notes as a list, not a single field:** the spec lists "Notes" as a customer field and "Add follow-up notes" as a feature. These were modeled as one thing — a `FollowUpNote` table (many notes per customer, each timestamped and attributed to the user who added it) — rather than a single overwritable text field, since that better matches "add follow-up notes" as an ongoing CRM activity log.
2. **Cancelling a Confirmed challan restores stock.** The spec doesn't say explicitly, but since "Confirmed" is defined as the point stock is committed, the reverse (cancelling) restores it. This is implemented via the same stock-movement/transaction pattern, so it's fully audited (`StockMovement` reason: "Challan ... cancelled -- stock restored").
3. **Challan confirmation is allowed for Sales, Warehouse, and Admin** — since either the person raising the challan or the person fulfilling it from the warehouse floor might be the one to confirm it. Adjust the `authorize(...)` list in `challans.routes.ts` if your actual approval flow is stricter.
4. **Two signup paths, split by privilege.** `POST /auth/signup` is public and lets someone create their own Sales/Warehouse/Accounts account for demo/reviewer convenience — but the role is restricted at the Zod schema level to those three, so a public visitor can never grant themselves Admin. `POST /auth/register` (Admin-only, requires an authenticated Admin JWT) can create a user with any role, including Admin. Initial Admin accounts come from the seed script.
5. **Challan numbers** are generated as `CH-{year}-{zero-padded id}` (e.g. `CH-2026-00001`), guaranteed unique since they're derived from the DB's own auto-increment id after insert (no race condition from a separate counter).
6. **Editing a challan's items is only allowed while it's a Draft** — once Confirmed or Cancelled it's locked, to keep the historical record trustworthy.

---

## 8. Known Limitations / Not Implemented

- No automated test suite (unit/integration tests) — given the 48h scope, effort went into correctness of the core business logic (stock transactions) over test coverage.
- No PDF invoice export, S3 image upload, or GitHub Actions CI/CD (all listed as bonus items in the spec).
- No password-reset flow (not required for an internally-provisioned tool with Admin-managed accounts).
- Pagination exists on all list endpoints, but the frontend doesn't cache/prefetch — each page change re-fetches.
- Low-stock alert is surfaced in the UI (dashboard count + row highlighting) but there's no email/notification system.
