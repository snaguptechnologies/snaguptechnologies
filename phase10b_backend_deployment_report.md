# Phase 10B Production Backend Deployment Report

## 1. Backend Deployment Configuration (Render Target)
- **Target Platform**: Render Web Service (or Railway / AWS EC2 / DigitalOcean App Platform).
- **Subdirectory / Root Directory**: `backend`
- **Node.js Engine**: `20.x` (`package.json` specifies `"node": ">=20.0.0"`).
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Health Check Endpoint**: `GET /api/health` -> returns `{ "status": "ok", "time": "..." }`.

---

## 2. Server Runtime & Port Handling
- Dynamic port allocation: `const PORT = process.env.PORT || 5000;` automatically respects platform-assigned `PORT` environment variables.
- Security Headers: `helmet()` security headers enabled.
- Login Rate Limiting: `express-rate-limit` caps login attempts to 50 per 15 mins per IP address.

---

## 3. CORS & Origin Validation
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'https://localhost:3000', process.env.FRONTEND_URL].filter(Boolean);
```
- CORS configuration validates requesting origins against `ALLOWED_ORIGINS` (comma-separated list) and handles preflight OPTIONS requests cleanly.

---

## 4. Certificate File Storage Audit & Recommendation
- **Current Mechanism**: PDFKit renders certificate documents directly to `/backend/certs/[cert_id].pdf` and Express serves them statically via `app.use('/certs', express.static(...))`.
- **Hosting Impact**:
  - On persistent Node.js servers (Render with Disk Mount, AWS EC2, DigitalOcean Droplet/App Platform with Storage Volume), writing to `/backend/certs/` functions seamlessly.
  - If deployed to ephemeral serverless containers, mounting a persistent cloud disk or syncing to object storage (AWS S3) is recommended.
- **Safety**: No code changes required; mounting persistent storage to `/backend/certs/` handles production certificate persistence safely.

---

## 5. Required Environment Variables Checklist (Without Secret Values)
- [ ] `PORT` (Cloud host port)
- [ ] `DB_HOST` (Database host domain/IP)
- [ ] `DB_USER` (Database username)
- [ ] `DB_PASSWORD` (Database password)
- [ ] `DB_NAME` (`snagup`)
- [ ] `DB_PORT` (`3306`)
- [ ] `DB_SSL` (`true`)
- [ ] `JWT_SECRET` (High-entropy signing secret)
- [ ] `ALLOWED_ORIGINS` (`https://snagup.com,https://www.snagup.com`)
- [ ] `FRONTEND_URL` (`https://snagup.com`)
- [ ] `SMTP_HOST` (SMTP server host)
- [ ] `SMTP_PORT` (`587`)
- [ ] `SMTP_USER` (SMTP username)
- [ ] `SMTP_PASS` (SMTP password)
- [ ] `SMTP_FROM` (`noreply@snagup.com`)

---

## 6. Manual Administrator Actions Required
- Create Web Service on Render / Railway pointing to `backend/` directory.
- Enter runtime environment variables in Render service dashboard.

---

## 7. Status & Decision
### **STATUS: MANUAL ACTION REQUIRED (EXTERNAL HOSTING)**
### **DECISION: GO (BACKEND PREPARATION COMPLETE)**
