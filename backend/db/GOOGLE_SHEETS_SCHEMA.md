# SnagUp Technologies - Google Sheets Database Schema & Data Dictionary

This document specifies the Google Sheets tab layout, column headers, ID strategies, and safety classifications for the 19 operational datasets prepared for the Google Sheets adapter layer (`backend/db/sheetsDb.js`).

---

## 1. Security Classification Matrix

| Classification | Datasets / Fields | Storage Strategy | Risk & Reason |
|---|---|---|---|
| **SAFE / OPERATIONAL** | `courses`, `batches`, `sessions`, `batch_materials`, `enrollments`, `payments`, `attendance`, `certificates`, `course_modules`, `course_lessons`, `lesson_completions`, `assessments`, `service_inquiries`, `course_applications`, `waitlist`, non-sensitive `settings`, `email_logs` | **Google Sheets API** | Operational business & learning data. Safe when sanitized by Express backend API guards. |
| **SENSITIVE / NON-EXPOSED** | `users.password_hash`, `users.reset_otp`, `users.reset_otp_expires` | **MUST REMAIN IN SECURE BACKEND AUTH STORE (MySQL / Encrypted Server Storage)** | Storing password hashes or active password reset OTP tokens in Google Sheets risks credential leakage. |
| **SECRETS / KEYS** | `JWT_SECRET`, `SMTP_PASS`, `razorpay_key_secret`, `GOOGLE_PRIVATE_KEY` | **MUST REMAIN STRICTLY IN SERVER ENVIRONMENT VARIABLES (`.env`)** | Critical API keys and private keys must never be written to spreadsheets. |
| **STUDENT SANITIZED** | `assessment_questions.correct_option_index` | **STRIPPED BY BACKEND REST API BEFORE CLIENT TRANSMISSION** | Raw answer keys must never be exposed over public API endpoints or client-readable JSON payloads. |

---

## 2. Tab Schema Specifications (19 Operational Sheets)

### 1. `courses`
- **Purpose**: Course catalog
- **ID Field**: `id` (String / Integer)
- **Columns**: `id`, `name`, `description`, `learning_objectives`, `prerequisites`, `duration_days`, `category`, `status`, `thumbnail`, `created_at`
- **Required Fields**: `id`, `name`, `category`
- **Example Row**: `["c_01", "Frontend Development", "Modern React & Responsive UI", "React, HTML, CSS", "None", 30, "Software Development", "active", "", "2026-01-01T00:00:00Z"]`
- **Safety Classification**: SAFE

### 2. `batches`
- **Purpose**: Course cohorts and schedules
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `course_id`, `instructor_id`
- **Columns**: `id`, `name`, `course_id`, `instructor_id`, `duration_days`, `price`, `enrollment_status`, `batch_status`, `start_date`, `end_date`, `session_link`, `session_time`, `session_date`, `session_message`, `material_link`, `material_message`, `broadcast_message`, `created_at`
- **Required Fields**: `id`, `name`, `course_id`
- **Example Row**: `["b_101", "Batch 1", "c_01", "u_admin", 30, 0, "open", "upcoming", "2026-09-20T00:00:00Z", "2026-10-20T00:00:00Z", "", "", "", "", "", "", "", "2026-09-01T00:00:00Z"]`
- **Safety Classification**: SAFE

### 3. `sessions`
- **Purpose**: Batch live class sessions
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `batch_id`
- **Columns**: `id`, `batch_id`, `date`, `time`, `link`, `message`, `notified_1h`, `notified_30m`, `last_emailed_at`, `created_at`
- **Required Fields**: `id`, `batch_id`, `date`, `time`, `link`
- **Example Row**: `["s_01", "b_101", "2026-09-21", "10:00 AM", "https://meet.google.com/xyz", "Welcome", 0, 0, "", "2026-09-13T00:00:00Z"]`
- **Safety Classification**: SAFE

### 4. `batch_materials`
- **Purpose**: Course batch study materials and resource links
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `batch_id`
- **Columns**: `id`, `batch_id`, `message`, `link`, `created_at`
- **Required Fields**: `id`, `batch_id`, `link`
- **Example Row**: `["bm_01", "b_101", "Module 1 Slides", "https://drive.google.com/doc1", "2026-09-13T00:00:00Z"]`
- **Safety Classification**: SAFE

### 5. `enrollments`
- **Purpose**: Student course batch enrollment status
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `student_id`, `batch_id`
- **Columns**: `id`, `student_id`, `batch_id`, `enrolled_at`, `status`, `admin_feedback`, `is_utr_updated`, `rejection_category`, `updated_at`
- **Required Fields**: `id`, `student_id`, `batch_id`, `status`
- **Example Row**: `["e_501", "u_std_01", "b_101", "2026-09-13T10:00:00Z", "approved", "", 0, "", "2026-09-13T10:05:00Z"]`
- **Safety Classification**: SAFE

### 6. `payments`
- **Purpose**: Payment transaction ledger (UPI UTR / Admin direct)
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `enrollment_id`, `student_id`
- **Columns**: `id`, `enrollment_id`, `student_id`, `amount`, `payment_method`, `transaction_id`, `status`, `created_at`
- **Required Fields**: `id`, `enrollment_id`, `student_id`, `transaction_id`
- **Example Row**: `["p_901", "e_501", "u_std_01", 0.00, "upi", "UTR-1234567890", "completed", "2026-09-13T10:00:00Z"]`
- **Safety Classification**: SAFE

### 7. `attendance`
- **Purpose**: Daily attendance records
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `student_id`, `batch_id`, `marked_by`
- **Columns**: `id`, `student_id`, `batch_id`, `date`, `status`, `marked_by`, `created_at`
- **Required Fields**: `id`, `student_id`, `batch_id`, `date`, `status`
- **Example Row**: `["att_01", "u_std_01", "b_101", "2026-09-13", "present", "u_admin", "2026-09-13T10:00:00Z"]`
- **Safety Classification**: SAFE

### 8. `certificates`
- **Purpose**: Issued certificate tracking and audit record
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `student_id`, `batch_id`, `released_by_admin_id`
- **Columns**: `id`, `student_id`, `batch_id`, `cert_id`, `pdf_path`, `issued_at`, `is_eligible`, `release_type`, `status`, `release_reason`, `released_by_admin_id`, `released_by_admin_name`, `progress_at_release`
- **Required Fields**: `id`, `student_id`, `batch_id`, `cert_id`
- **Example Row**: `["cert_01", "u_std_01", "b_101", "SNAG-2026-0001", "certs/cert_01.pdf", "2026-09-13T10:00:00Z", 1, "AUTOMATIC", "GENERATED", "", "", "", 100.00]`
- **Safety Classification**: SAFE

### 9. `course_modules`
- **Purpose**: Course syllabus module structure
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `course_id`
- **Columns**: `id`, `course_id`, `title`, `description`, `sequence_order`, `status`, `created_at`
- **Required Fields**: `id`, `course_id`, `title`
- **Example Row**: `["m_01", "c_01", "Module 1: Fundamentals", "Basic Concepts", 1, "active", "2026-09-13T00:00:00Z"]`
- **Safety Classification**: SAFE

### 10. `course_lessons`
- **Purpose**: Individual lessons within course modules
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `module_id`
- **Columns**: `id`, `module_id`, `title`, `description`, `resource_url`, `video_url`, `sequence_order`, `status`, `created_at`
- **Required Fields**: `id`, `module_id`, `title`
- **Example Row**: `["les_01", "m_01", "Lesson 1: Introduction", "Overview", "", "https://youtube.com/watch?v=123", 1, "active", "2026-09-13T00:00:00Z"]`
- **Safety Classification**: SAFE

### 11. `lesson_completions`
- **Purpose**: Student lesson completion tracking
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `student_id`, `lesson_id`
- **Columns**: `id`, `student_id`, `lesson_id`, `completed_at`
- **Required Fields**: `id`, `student_id`, `lesson_id`
- **Example Row**: `["lc_01", "u_std_01", "les_01", "2026-09-13T10:00:00Z"]`
- **Safety Classification**: SAFE

### 12. `assessments`
- **Purpose**: Course and module assessment tests
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `course_id`, `module_id`
- **Columns**: `id`, `course_id`, `module_id`, `title`, `description`, `pass_percentage`, `time_limit_mins`, `max_attempts`, `status`, `created_at`
- **Required Fields**: `id`, `course_id`, `title`
- **Example Row**: `["ass_01", "c_01", "m_01", "Quiz 1", "Module 1 Quiz", 70, 15, 3, "active", "2026-09-13T00:00:00Z"]`
- **Safety Classification**: SAFE

### 13. `assessment_questions`
- **Purpose**: Assessment questions (MCQ / True-False)
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `assessment_id`
- **Columns**: `id`, `assessment_id`, `question_text`, `question_type`, `options_json`, `correct_option_index`, `points`, `sequence_order`
- **Required Fields**: `id`, `assessment_id`, `question_text`, `options_json`, `correct_option_index`
- **Example Row**: `["q_01", "ass_01", "What is React?", "mcq", "[\"Library\",\"Framework\",\"Language\"]", 0, 1, 1]`
- **Special Handling**: `correct_option_index` must be stripped by backend before sending questions to student clients.
- **Safety Classification**: OPERATIONAL / RESTRICTED FIELD

### 14. `assessment_attempts`
- **Purpose**: Student assessment attempt logs and score results
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `assessment_id`, `student_id`, `batch_id`
- **Columns**: `id`, `assessment_id`, `student_id`, `batch_id`, `score_obtained`, `total_points`, `percentage`, `is_passed`, `attempt_number`, `status`, `answers_json`, `started_at`, `submitted_at`
- **Required Fields**: `id`, `assessment_id`, `student_id`, `batch_id`
- **Example Row**: `["attp_01", "ass_01", "u_std_01", "b_101", 10, 10, 100.00, 1, 1, "completed", "{\"q_01\":0}", "2026-09-13T10:00:00Z", "2026-09-13T10:10:00Z"]`
- **Safety Classification**: SAFE

### 15. `service_inquiries`
- **Purpose**: Public contact service inquiries
- **ID Field**: `id` (String / Integer)
- **Columns**: `id`, `name`, `email`, `phone`, `service_type`, `message`, `status`, `created_at`
- **Required Fields**: `id`, `name`, `email`, `service_type`
- **Example Row**: `["inq_01", "John Doe", "john@example.com", "9876543210", "Web Development", "Inquiry message", "pending", "2026-09-13T00:00:00Z"]`
- **Safety Classification**: SAFE

### 16. `course_applications`
- **Purpose**: Direct course applications submitted by students
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `student_id`, `course_id`
- **Columns**: `id`, `app_id`, `student_id`, `student_name`, `phone`, `email`, `college_name`, `college_register_id`, `whatsapp_number`, `course_id`, `course_name`, `status`, `created_at`, `updated_at`
- **Required Fields**: `id`, `app_id`, `student_id`, `student_name`
- **Example Row**: `["ca_01", "APP-20260913-1001", "u_std_01", "Jane Doe", "9876543210", "jane@example.com", "ABC College", "REG123", "9876543210", "c_01", "Frontend Development", "Applied", "2026-09-13T10:00:00Z", "2026-09-13T10:00:00Z"]`
- **Safety Classification**: SAFE

### 17. `waitlist`
- **Purpose**: Student batch waitlist reservations
- **ID Field**: `id` (String / Integer)
- **Related IDs**: `student_id`, `batch_id`
- **Columns**: `id`, `student_id`, `batch_id`, `created_at`
- **Required Fields**: `id`, `student_id`, `batch_id`
- **Example Row**: `["wl_01", "u_std_01", "b_101", "2026-09-13T10:00:00Z"]`
- **Safety Classification**: SAFE

### 18. `settings`
- **Purpose**: System configuration settings (non-sensitive)
- **ID Field**: `key` (String Primary Key)
- **Columns**: `key`, `value`
- **Required Fields**: `key`, `value`
- **Example Rows**:
  - `["site_name", "Snagup Technologies"]`
  - `["min_attendance_pct", "75"]`
  - `["upi_id", "payments@snagup"]`
- **Security Note**: Secrets (`razorpay_key_secret`, `JWT_SECRET`, `SMTP_PASS`) must NOT be saved here.
- **Safety Classification**: OPERATIONAL / NON-SENSITIVE

### 19. `email_logs`
- **Purpose**: Sent email audit tracking log
- **ID Field**: `id` (String / Integer)
- **Columns**: `id`, `recipient_email`, `subject`, `purpose`, `body`, `html`, `status`, `sent_at`
- **Required Fields**: `id`, `recipient_email`, `subject`
- **Example Row**: `["el_01", "student@example.com", "Enrollment Approved", "enrollment_success", "", "", "sent", "2026-09-13T10:00:00Z"]`
- **Safety Classification**: SAFE

---

## 3. ID Strategy Guidelines

1. **Row Index Protection**: Google Sheets row numbers (`1`, `2`, `3`...) are variable and change when sheets are sorted or rows deleted. Therefore, row numbers MUST NEVER be used as logical application IDs.
2. **Stable Unique Primary Keys**: All records written to Google Sheets tabs have an explicit `id` string (e.g. `c_01`, `b_101`, or UUID `8f3b2a19-...`).
3. **Foreign Key Integrity**: All relation attributes (`course_id`, `batch_id`, `student_id`) match the stable `id` primary key string across tabs.
