# Deployment Guide — Step by Step

This gets you three live URLs: **database**, **backend API**, **frontend**. All on free tiers.

---

## Part 1 — Database (Railway MySQL, free tier)

1. Go to https://railway.app → sign in with GitHub.
2. **New Project → Provision MySQL**.
3. Click the MySQL service → **Connect** tab → copy the `MYSQL_URL` (format: `mysql://user:pass@host:port/railway`).
4. Keep this tab open — you'll paste this URL into Render in Part 2.

*(Alternative free MySQL hosts: Aiven, Neon isn't MySQL — it's Postgres, so skip it here. Railway is the simplest for MySQL.)*

---

## Part 2 — Backend (Render)

1. Push this project to a GitHub repo (see Part 0 below if you haven't yet).
2. Go to https://render.com → sign in with GitHub → **New → Web Service**.
3. Connect your repo. Render will detect `render.yaml` in the repo root automatically — click **Apply**.
   - If it doesn't auto-detect, set manually:
     - **Root Directory:** `backend`
     - **Build Command:** `npm install && npx prisma generate && npm run build`
     - **Start Command:** `npx prisma migrate deploy && npm start`
4. Under **Environment**, set:
   - `DATABASE_URL` → paste the Railway MySQL URL from Part 1
   - `JWT_SECRET` → Render can auto-generate this (already configured in render.yaml), or set your own long random string
   - `JWT_EXPIRES_IN` → `8h`
   - `FRONTEND_URL` → leave blank for now, you'll come back and set this after Part 3 (needed for CORS)
5. Deploy. Wait for the build to finish — first deploy runs your Prisma migrations automatically.
6. Once live, copy your backend URL, e.g. `https://erp-backend-xxxx.onrender.com`.
7. **Seed the database** (one-time): in Render's dashboard, open the service → **Shell** tab, run:
   ```bash
   npm run seed
   ```
   This creates your 4 test login accounts.
8. Verify: visit `https://erp-backend-xxxx.onrender.com/health` → should return `{"success":true,"message":"API is up."}`.

> **Free-tier note:** Render's free web services spin down after inactivity and take ~30-60s to wake on the next request. That's expected — not a bug.

---

## Part 3 — Frontend (Vercel)

1. Go to https://vercel.com → sign in with GitHub → **Add New → Project**.
2. Import the same repo.
3. Set **Root Directory** to `frontend`.
4. Framework preset: Vite (auto-detected).
5. Add environment variable:
   - `VITE_API_URL` → your Render backend URL from Part 2, e.g. `https://erp-backend-xxxx.onrender.com`
6. Deploy. Copy your frontend URL, e.g. `https://erp-portal.vercel.app`.

---

## Part 4 — Close the loop (CORS)

1. Go back to Render → your backend service → **Environment**.
2. Set `FRONTEND_URL` to your Vercel URL from Part 3 (e.g. `https://erp-portal.vercel.app`).
3. Save → Render redeploys automatically.
4. Open your Vercel URL, log in with a seeded account, confirm data loads (customers/products/challans lists).

---

## Part 0 — If you haven't pushed to GitHub yet

```bash
cd mini-erp-crm
git init
git add .
git commit -m "Initial commit: Mini ERP + CRM"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
Make sure `backend/.env` and `frontend/.env` are NOT committed — they're already in `.gitignore`.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Frontend loads but API calls fail / CORS error | `FRONTEND_URL` on Render doesn't match your Vercel URL exactly (check http vs https, trailing slash) |
| Backend `/health` times out on first hit | Free tier cold start — wait 30-60s and retry |
| Login fails with "Invalid email or password" | Seed script hasn't run yet — run `npm run seed` in Render's Shell tab |
| Prisma migration fails on deploy | `DATABASE_URL` malformed or Railway MySQL not fully provisioned yet — double check the connection string |
