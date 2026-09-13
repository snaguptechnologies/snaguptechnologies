# Phase 8A Deployment Configuration Verification Report

## Baseline Reference
- **Commit Hash**: `dc3b9f1` ("Complete LMS assessment integration and production cleanup").
- **Branch**: `snagup-rebuild`.
- **Status**: Codebase inspected and verified. Application functionality is 100% untouched.

---

## 1. Exact Frontend Deployment Settings (Vercel)
- **Repository Source**: GitHub repository (`snaguptechnologies`), branch `snagup-rebuild`.
- **Vercel Framework Preset**: Next.js (automatically detected).
- **Vercel Root Directory**: `./` (Root of repository).
- **Node.js Version**: `20.x` (enforced by root `package.json` `"engines": { "node": ">=20.0.0" }`).
- **Build Command**: `next build` (or `npm run build`).
- **Output Directory**: `.next` (default).
- **Install Command**: `npm install`.

---

## 2. Exact Backend Deployment Settings (Cloud Host)
- **Target Platforms**: Render / Railway / AWS EC2 / DigitalOcean App Platform.
- **Backend Root Subdirectory**: `backend/` (set working directory or root directory to `backend`).
- **Node.js Version**: `20.x` (enforced by `backend/package.json` `"engines": { "node": ">=20.0.0" }`).
- **Build Command**: `npm install`.
- **Start Command**: `node server.js` (enforced by `backend/package.json` `"scripts": { "start": "node server.js" }`).
- **Health Check Path**: `GET /api/health` -> returns `{ "status": "ok" }`.

---

## 3. Exact Required Environment Variables

### Frontend Environment Variables (Vercel Dashboard)
- `NEXT_PUBLIC_API_URL`: Canonical backend API URL (e.g., `https://api.snagup.com/api` or `https://snagup-api.onrender.com/api`).
- `NEXT_PUBLIC_BACKEND_URL`: Canonical backend domain root without `/api` (e.g., `https://api.snagup.com` or `https://snagup-api.onrender.com`).

### Backend Environment Variables (Cloud Host Dashboard)
- `PORT`: Server port (defaults to `5000` or cloud-assigned port).
- `DB_HOST`: Host domain or IP of production MySQL instance.
- `DB_USER`: Username for MySQL connection.
- `DB_PASSWORD`: Password for MySQL user.
- `DB_NAME`: Database name (`snagup`).
- `DB_PORT`: Database port (`3306`).
- `DB_SSL`: `true` (enforces SSL encryption for remote MySQL connection).
- `JWT_SECRET`: High-entropy secure random string for JWT token generation.
- `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend domain origins for CORS (e.g., `https://snagup.com,https://www.snagup.com`).
- `FRONTEND_URL`: Production frontend URL (e.g., `https://snagup.com`).
- `SMTP_HOST`: Nodemailer SMTP host (e.g., `smtp.sendgrid.net`).
- `SMTP_PORT`: SMTP port (`587`).
- `SMTP_USER`: SMTP username.
- `SMTP_PASS`: SMTP password.
- `SMTP_FROM`: Sender email address (e.g., `noreply@snagup.com`).
- `RAZORPAY_KEY_ID`: Live Razorpay Key ID (`rzp_live_...`).
- `RAZORPAY_KEY_SECRET`: Live Razorpay Key Secret.

---

## 4. Database Requirements
- **Engine**: Managed MySQL 8.0 or MariaDB instance.
- **Database Name**: `snagup`.
- **Character Set / Collation**: `utf8mb4` / `utf8mb4_unicode_ci`.
- **Privileges**: Application user requires full CRUD and DDL privileges (`SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX`).
- **Auto-Initialization**: Database pool in [backend/db/database.js](file:///c:/Users/Admin/OneDrive/Desktop/snaguptechnologies-main/backend/db/database.js) automatically initializes all 23 relational tables, default system settings, and seed admin user on startup if not present.

---

## 5. CORS Requirements
- Handled in `backend/server.js` lines 27-54:
  `ALLOWED_ORIGINS` must include exact production frontend protocols and hostnames (e.g., `https://snagup.com,https://www.snagup.com`).

---

## 6. API URL Requirements
- All frontend API calls route through `API_ENDPOINTS` in [app/lib/api.ts](file:///c:/Users/Admin/OneDrive/Desktop/snaguptechnologies-main/app/lib/api.ts).
- `NEXT_PUBLIC_API_URL` MUST include the `/api` prefix (e.g., `https://api.snagup.com/api`).
- `NEXT_PUBLIC_BACKEND_URL` MUST NOT include the `/api` prefix (e.g., `https://api.snagup.com`).

---

## 7. Domain / DNS Requirements
- **Root & WWW Domain**: `snagup.com` and `www.snagup.com` mapped via CNAME/A-records to Vercel DNS (`cname.vercel-dns.com`).
- **API Subdomain**: `api.snagup.com` mapped via CNAME to backend cloud host endpoint.

---

## 8. Deployment Risks & Safeguards
- **Risk**: Missing `JWT_SECRET` falls back to default key in development.
  - *Safeguard*: Explicitly define `JWT_SECRET` in backend host dashboard.
- **Risk**: Omitting `NEXT_PUBLIC_API_URL` during Vercel build will fallback to `http://localhost:5000/api`.
  - *Safeguard*: Set `NEXT_PUBLIC_API_URL` in Vercel project environment variables prior to triggering production build.
- **Risk**: CORS blocking browser fetch requests if `ALLOWED_ORIGINS` is missing production URL.
  - *Safeguard*: Add both `https://snagup.com` and `https://www.snagup.com` to `ALLOWED_ORIGINS`.

---

## 9. Manual Actions Required From User
To execute deployment, the user must manually complete:
1. Provision cloud MySQL database (e.g., AWS RDS / PlanetScale / Aiven / DigitalOcean).
2. Create cloud web service for Express backend (`backend/` directory) and set environment variables.
3. Import GitHub repository branch `snagup-rebuild` into Vercel and set `NEXT_PUBLIC_API_URL`.
4. Configure DNS CNAME records for `snagup.com` (Vercel) and `api.snagup.com` (Backend host).

---

## 10. GO / NO-GO Decision
### **GO**
The deployment configuration is verified, type-safe (0 TypeScript errors), compiles cleanly to Next.js production build, and is **READY FOR PRODUCTION DEPLOYMENT**.
