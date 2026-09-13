# Phase 10A Production Database Audit Report

## 1. Database Architecture
- **Driver / Engine**: `mysql2/promise` connection pool on Node.js.
- **Connection Pool Config**:
  - `waitForConnections: true`
  - `connectionLimit: 10`
  - `queueLimit: 0`
  - `multipleStatements: true`
- **SSL / TLS Configuration**: Controlled dynamically via `process.env.DB_SSL`. In [backend/db/database.js](file:///c:/Users/Admin/OneDrive/Desktop/snaguptechnologies-main/backend/db/database.js):
  `ssl: (process.env.DB_SSL === 'true' || (dbHost !== 'localhost' && dbHost !== '127.0.0.1')) ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : false`

---

## 2. Managed MySQL Provider Recommendation & Specifications
- **Recommended Cloud Provider**: AWS RDS for MySQL 8.0, DigitalOcean Managed MySQL, PlanetScale, or Aiven MySQL.
- **Minimum Instance Specs**:
  - MySQL Version: `8.0` (or MariaDB `10.6+`).
  - Storage: `20 GB SSD` (auto-scaling storage enabled).
  - RAM: `1 GB` (production minimum recommended).
  - Connections: `100+ max connections`.
  - Backup: Daily automated snapshots with 7-day retention.

---

## 3. Environment Variable Checklist (Without Values)
- [ ] `DB_HOST` (Production database host domain or IP)
- [ ] `DB_PORT` (Database port, default `3306`)
- [ ] `DB_USER` (Application database username)
- [ ] `DB_PASSWORD` (Application database user password)
- [ ] `DB_NAME` (Database name: `snagup`)
- [ ] `DB_SSL` (`true` to enforce TLS 1.2+ SSL encryption)

---

## 4. Expected Database Schema (23 Verified Tables)
1. `users` (User auth, roles: `admin`, `instructor`, `student`, password hashes, OTP reset flags)
2. `courses` (Course catalog, objectives, prerequisites, categories, status)
3. `batches` (Cohorts, instructor linkage, price, status, session links, material links)
4. `sessions` (Synchronized live class schedule, reminder notification flags)
5. `enrollments` (Student-batch mapping, approval status, UTR tracking, guideline timestamps)
6. `payments` (Financial transaction records, enrollment linkage, status)
7. `attendance` (Date-based student attendance records: `present`/`absent`, marked_by)
8. `certificates` (PDF certificates, cert_id, `release_type`, admin override audit fields)
9. `waitlist` (Waitlisted student records per batch)
10. `service_inquiries` (Platform service lead inquiries)
11. `batch_materials` (Stack of learning material links and messages)
12. `settings` (Key-value platform configuration store, gate keys, minimum attendance pct)
13. `email_logs` (Sent email audit trail)
14. `course_applications` (Student course application records)
15. `student_activities` (Audit log of student application and learning events)
16. `digital_twin_devices` (Security digital twin state machine nodes)
17. `security_events` (Security event history and anomaly telemetry)
18. `course_modules` (Module hierarchy per course)
19. `course_lessons` (Lessons per module with resource and video URLs)
20. `lesson_completions` (Student lesson completion tracking)
21. `assessments` (Assessments per course/module with pass percentage, time limit, max attempts)
22. `assessment_questions` (MCQ / True-False question bank)
23. `assessment_attempts` (Test attempt execution logs, score, percentage, pass/fail result)

---

## 5. Non-Destructive Data Preservation Safeguards
- All table DDL queries use `CREATE TABLE IF NOT EXISTS`.
- Platform settings use `INSERT IGNORE INTO settings`.
- Admin user seeding checks existing email (`SELECT id FROM users WHERE email = 'admin@snagup.com'`) before inserting. Existing admin credentials or database records are **NOT** overwritten upon server restarts.
- Column migrations use `ALTER TABLE ... ADD COLUMN` inside `try { ... } catch (e) {}` blocks.
- **Zero SQLite / local file database dependencies** exist in the production database pool.

---

## 6. Connection Verification Procedure
1. Provision cloud MySQL 8.0 instance.
2. Configure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=snagup`, `DB_SSL=true`.
3. Start backend server: `node backend/server.js`.
4. Inspect startup logs for: `✅ Database 'snagup' ensured.` and `✅ MySQL Database schema initialized.`

---

## 7. Manual Administrator Actions Required
- Provision managed MySQL database on AWS RDS / DigitalOcean / PlanetScale.
- Add database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_SSL=true`) to cloud hosting environment settings.

---

## 8. Status & Decision
### **STATUS: MANUAL ACTION REQUIRED (EXTERNAL DEPENDENCY)**
### **DECISION: GO (DATABASE PREPARATION COMPLETE)**
