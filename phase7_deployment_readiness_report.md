# Phase 7 Production Deployment & Live Verification Report

## 1. Executive Summary
This report establishes the Phase 7 Deployment & Live Verification readiness for SnagUp Technologies using baseline commit `dc3b9f1`. It audits the deployment configuration, environment variables, hosting architecture, database pool parameters, CORS rules, and security secrets required to launch the application to live production servers without modifying code or exposing credentials.

---

## 2. Infrastructure & Hosting Target Architecture

### Frontend Deployment Target
- **Framework**: Next.js 16.2.2 (React 19, App Router).
- **Target Platform**: Vercel / Netlify / AWS Amplify / Cloudflare Pages.
- **Build Command**: `npm run build` (`next build`).
- **Output**: 14 static and dynamic pre-rendered routes.

### Backend Deployment Target
- **Framework**: Express.js REST API on Node.js environment (`backend/server.js`).
- **Target Platform**: Render / Railway / AWS EC2 / DigitalOcean App Platform / Heroku.
- **Start Command**: `node backend/server.js` or `npm start`.
- **Port**: Configured via `process.env.PORT` (defaults to `5000`).

---

## 3. Environment Variables Configuration Inventory

### Frontend Environment Variables (Build / Runtime)
| Variable | Description | Example / Format |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Production Express API URL | `https://api.snagup.com/api` |
| `NEXT_PUBLIC_BACKEND_URL` | Base backend server URL (without `/api`) | `https://api.snagup.com` |

### Backend Environment Variables (Runtime)
| Variable | Description | Example / Format |
|---|---|---|
| `PORT` | Express server port | `5000` or assigned cloud port |
| `DB_HOST` | Production MySQL host domain/IP | `db.snagup.com` |
| `DB_USER` | Production MySQL user | `snagup_prod_user` |
| `DB_PASSWORD` | Production MySQL password | `[SECURE_DB_PASSWORD]` |
| `DB_NAME` | MySQL database name | `snagup` |
| `DB_PORT` | MySQL connection port | `3306` |
| `DB_SSL` | Enable SSL for remote database connection | `true` |
| `JWT_SECRET` | Secret key for signing user auth tokens | `[SECURE_RANDOM_JWT_SECRET]` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed domains | `https://snagup.com,https://www.snagup.com` |
| `FRONTEND_URL` | Canonical frontend domain URL | `https://snagup.com` |
| `SMTP_HOST` | Production Nodemailer SMTP host | `smtp.sendgrid.net` |
| `SMTP_PORT` | Production Nodemailer SMTP port | `587` |
| `SMTP_USER` | Production SMTP authentication username | `apikey` |
| `SMTP_PASS` | Production SMTP authentication password | `[SECURE_SMTP_PASSWORD]` |
| `SMTP_FROM` | Production sender email address | `noreply@snagup.com` |
| `RAZORPAY_KEY_ID` | Production Razorpay key ID | `rzp_live_xxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Production Razorpay secret key | `[SECURE_RAZORPAY_SECRET]` |

---

## 4. Localhost & Development Fallback Inventory
The following fallback values exist in code to ensure seamless local development when environment variables are omitted. In production, setting the corresponding environment variable dynamically overrides each default:
1. `app/lib/api.ts` line 4: `http://localhost:5000/api` (overridden by `NEXT_PUBLIC_API_URL`).
2. `app/lib/api.ts` line 7: `http://localhost:5000` (overridden by `NEXT_PUBLIC_BACKEND_URL`).
3. `backend/server.js` line 30: `http://localhost:3000` (overridden by `ALLOWED_ORIGINS`).
4. `backend/routes/certificates.js` line 99: `http://localhost:3000` (overridden by `FRONTEND_URL`).
5. `backend/lib/emailService.js` line 20: `http://localhost:3000` (overridden by `FRONTEND_URL`).
6. `backend/routes/auth.js` line 9: `'snagup_secret_2026'` (overridden by `JWT_SECRET`).
7. `backend/middleware/auth.js` line 2: `'snagup_secret_2026'` (overridden by `JWT_SECRET`).

---

## 5. Deployment Audit Categorization

### Verified (Production Ready)
- Next.js 16 App Router code structure and pre-rendered route generation (14 routes).
- Express REST API route structure (17 route modules).
- MySQL 23-table auto-creation and connection pool configuration (`mysql2/promise`).
- Parameterized SQL queries preventing injection vulnerabilities.
- Server-side grading, sanitized question payloads, attempt locking, and certificate verification logic.
- Dual-path certificate issuance (Automatic 80% threshold + Admin Override audit workflow).
- TypeScript compilation (`npx tsc --noEmit` passed with 0 errors).
- Next.js production build (`npm run build` passed with 0 errors).

### Requires User Configuration (Deployment Step)
- Provisioning production MySQL database instance (e.g. AWS RDS / PlanetScale / DigitalOcean MySQL).
- Configuring backend environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `FRONTEND_URL`, `SMTP_HOST`, `SMTP_PASS`).
- Configuring frontend hosting environment variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BACKEND_URL`).
- Configuring production Razorpay live key ID & secret in database `settings` table or environment variables.

### Requires Runtime Testing (Post-Deployment Verification)
- Verification of live SSL handshake between Express backend and remote MySQL host (`DB_SSL=true`).
- Verification of live SMTP email delivery for password reset OTPs.
- Verification of live Razorpay payment webhook / payment verification callback.
- Verification of live PDFKit certificate download on production domain.

### Blocked by Infrastructure
- Real-browser automated E2E testing (blocked locally by host environment Playwright CDN network restrictions).

---

## 6. Precise Deployment Checklist for SnagUp

### Step 1: Database Setup
1. Provision a remote MySQL 8.0 / MariaDB instance.
2. Record host domain, port (3306), database name (`snagup`), username, and password.
3. Ensure inbound port 3306 is accessible from backend server IP addresses.

### Step 2: Backend API Deployment (e.g. Render / Railway / AWS / DigitalOcean)
1. Deploy `backend/` directory to host platform.
2. Set build command: `npm install`.
3. Set start command: `node backend/server.js`.
4. Configure production environment variables:
   - `PORT=5000`
   - `DB_HOST=[YOUR_DB_HOST]`
   - `DB_USER=[YOUR_DB_USER]`
   - `DB_PASSWORD=[YOUR_DB_PASSWORD]`
   - `DB_NAME=snagup`
   - `DB_SSL=true`
   - `JWT_SECRET=[YOUR_HIGH_ENTROPY_JWT_SECRET]`
   - `ALLOWED_ORIGINS=https://[YOUR_FRONTEND_DOMAIN]`
   - `FRONTEND_URL=https://[YOUR_FRONTEND_DOMAIN]`
   - `SMTP_HOST=[YOUR_SMTP_HOST]`
   - `SMTP_PORT=587`
   - `SMTP_USER=[YOUR_SMTP_USER]`
   - `SMTP_PASS=[YOUR_SMTP_PASS]`
   - `SMTP_FROM=noreply@[YOUR_DOMAIN]`
5. Verify `/api/health` returns `{ "status": "ok" }`.

### Step 3: Frontend Deployment (e.g. Vercel)
1. Connect repository branch `snagup-rebuild` to Vercel project.
2. Configure build environment variables:
   - `NEXT_PUBLIC_API_URL=https://[YOUR_BACKEND_DOMAIN]/api`
   - `NEXT_PUBLIC_BACKEND_URL=https://[YOUR_BACKEND_DOMAIN]`
3. Trigger build (`next build`).
4. Verify custom domain DNS mapping.

### Step 4: Post-Deployment Smoke Verification
1. Log in to Admin portal (`/login`).
2. Create test course and batch.
3. Register test student, apply for enrollment, approve enrollment from Admin triage.
4. Log in as student, access batch workspace (`/dashboard/student/workspace/[batchId]`), attempt test, verify server-side score calculation.
5. Verify certificate eligibility evaluation and PDF generation.

---

## 7. Status Summary
- **TypeScript**: **Passed (0 errors)**
- **Production Build**: **Passed (0 errors)**
- **Git State**: Baseline commit `dc3b9f1` clean.
