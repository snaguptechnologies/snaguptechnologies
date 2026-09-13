# Phase 8 SnagUp Production Deployment Plan

## Baseline Checkpoint
- **Commit Hash**: `dc3b9f1` ("Complete LMS assessment integration and production cleanup").
- **Target Architecture**:
  - **Frontend**: Next.js 16.2.2 (React 19 App Router) deployed to **Vercel**.
  - **Backend**: Express.js REST API on Node.js deployed to **Render / Railway / AWS EC2 / DigitalOcean**.
  - **Database**: Managed **MySQL 8.0 / MariaDB** cloud database (e.g. AWS RDS / PlanetScale / Aiven / DigitalOcean MySQL).

---

## 1. Frontend Deployment Steps (Vercel)
1. **Connect Repository**: Import the `snaguptechnologies` repository into Vercel and select the `snagup-rebuild` branch.
2. **Framework Preset**: Vercel automatically detects Next.js.
3. **Build & Output Settings**:
   - Build Command: `npm run build` (`next build`).
   - Output Directory: `.next` (default).
   - Install Command: `npm install`.
4. **Environment Variables**: Configure the following in Vercel Project Settings → Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://[YOUR_BACKEND_DOMAIN]/api`
   - `NEXT_PUBLIC_BACKEND_URL` = `https://[YOUR_BACKEND_DOMAIN]`
5. **Deploy**: Trigger initial production deployment. Vercel provisions global edge CDN routing and SSL certificates.

---

## 2. Backend Deployment Steps (Cloud Backend Host)
1. **Host Setup**: Create a Web Service on Render, Railway, AWS App Runner/EC2, or DigitalOcean App Platform.
2. **Root Directory & Node Version**:
   - Subdirectory: `/backend` (or set Root Directory to `backend`).
   - Node.js Runtime: Version `>= 20.0.0`.
3. **Build & Start Commands**:
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. **Environment Variables**: Populate runtime environment variables in hosting dashboard (see Section 4 below).
5. **Health Check Endpoint**: Set health check URL to `https://[YOUR_BACKEND_DOMAIN]/api/health`.

---

## 3. Database Setup Requirements
1. **Provision Instance**: Create a MySQL 8.0 instance on AWS RDS, PlanetScale, Aiven, or DigitalOcean Managed MySQL.
2. **Database & Privileges**:
   - Database Name: `snagup`
   - Character Set: `utf8mb4`
   - Collation: `utf8mb4_unicode_ci`
   - Grant full privileges (`SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX`) to application database user.
3. **Automated Schema Initialization**:
   - When `node server.js` starts, [backend/db/database.js](file:///c:/Users/Admin/OneDrive/Desktop/snaguptechnologies-main/backend/db/database.js) automatically initializes all 23 relational tables, default system settings, and seed admin user if not present.
4. **Networking & Security**:
   - Enable SSL mode by setting `DB_SSL=true`.
   - Whitelist cloud backend hosting outbound IP addresses or allow secure VPC connections to port `3306`.

---

## 4. Environment-Variable Checklist

### Frontend (Vercel Dashboard)
- [ ] `NEXT_PUBLIC_API_URL` -> `https://api.snagup.com/api`
- [ ] `NEXT_PUBLIC_BACKEND_URL` -> `https://api.snagup.com`

### Backend (Hosting Dashboard)
- [ ] `PORT` -> `5000` (or assigned cloud port)
- [ ] `DB_HOST` -> Database host address (e.g. `db.snagup.com`)
- [ ] `DB_USER` -> Database user name
- [ ] `DB_PASSWORD` -> Database secure password
- [ ] `DB_NAME` -> `snagup`
- [ ] `DB_PORT` -> `3306`
- [ ] `DB_SSL` -> `true`
- [ ] `JWT_SECRET` -> High-entropy random secret string
- [ ] `ALLOWED_ORIGINS` -> `https://snagup.com,https://www.snagup.com`
- [ ] `FRONTEND_URL` -> `https://snagup.com`
- [ ] `SMTP_HOST` -> Production SMTP host (e.g. `smtp.sendgrid.net`)
- [ ] `SMTP_PORT` -> `587`
- [ ] `SMTP_USER` -> Production SMTP username
- [ ] `SMTP_PASS` -> Production SMTP password
- [ ] `SMTP_FROM` -> `noreply@snagup.com`
- [ ] `RAZORPAY_KEY_ID` -> Live Razorpay key ID (`rzp_live_...`)
- [ ] `RAZORPAY_KEY_SECRET` -> Live Razorpay secret key

---

## 5. CORS Configuration Requirements
In `backend/server.js`, CORS is configured to validate requesting origins dynamically:
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'https://localhost:3000', process.env.FRONTEND_URL].filter(Boolean);
```
- Ensure `ALLOWED_ORIGINS` contains exact production frontend domain protocol and hostname (e.g., `https://snagup.com,https://www.snagup.com`).

---

## 6. Domain Configuration
1. **Frontend Domain**: Point root domain `snagup.com` and `www.snagup.com` CNAME/A-records to Vercel DNS (`cname.vercel-dns.com`).
2. **Backend Domain**: Point API subdomain `api.snagup.com` to backend hosting CNAME (e.g., `snagup-api.onrender.com`).

---

## 7. SSL / HTTPS Requirements
- All production traffic must use HTTPS (`https://`).
- SSL certificates automatically issued by Vercel for frontend domains and cloud host for API subdomains.
- Database connection enforces SSL encryption via `DB_SSL=true`.

---

## 8. Post-Deployment Smoke Tests
1. **Health Check**: Call `GET https://api.snagup.com/api/health` -> verify status `200 OK`.
2. **Public Routing**: Visit `https://snagup.com` -> verify home page and course catalog load seamlessly.
3. **Authentication**: Perform Admin login (`/login`) -> verify JWT issuance and dashboard render.
4. **Assessment Engine**: Access student workspace test taker -> verify timed test start, sanitized question load, server-side grading, attempt recording.
5. **Certificate PDF**: Verify certificate eligibility calculation and public verification page `/api/certificates/verify/:cert_id`.

---

## 9. Rollback Procedure
1. **Frontend Rollback**: In Vercel deployment dashboard, select previous successful deployment instant rollback.
2. **Backend Rollback**: Revert deployment tag to baseline commit `dc3b9f1` in cloud hosting dashboard.
3. **Database Safeguard**: Application schema is backward compatible; default tables use `CREATE TABLE IF NOT EXISTS` preserving data integrity.

---

## 10. Manual User Actions Required
To complete live deployment, the user must perform the following manual tasks:

1. **Provision MySQL Cloud Database**: Create MySQL 8.0 instance on AWS RDS / PlanetScale / Aiven / DigitalOcean and copy database host, username, password.
2. **Set Up Cloud Backend Service**: Create web service on Render / Railway / AWS / DigitalOcean pointing to `backend/` directory.
3. **Configure Backend Environment Variables**: Enter `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `FRONTEND_URL`, `SMTP_HOST`, `SMTP_PASS` in backend host dashboard.
4. **Deploy Frontend to Vercel**: Import repository on Vercel, set `NEXT_PUBLIC_API_URL` to backend URL, and deploy.
5. **Configure DNS Records**: Map `snagup.com` to Vercel and `api.snagup.com` to backend web service.
