const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { notifyCertificateIssued } = require('../lib/emailService');
const { getSupabaseClient } = require('../lib/jwtConfig');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// ─── Certificate Generation Internal Helper ──────────────────────────────────
async function generateCertificateInternal(student_id, batch_id, options = {}) {
  const {
    custom_cert_id = null,
    sendNotification = true,
    is_admin_override = false,
    release_reason = null,
    admin_id = null,
    admin_name = null
  } = (typeof options === 'object' && options !== null) ? options : { custom_cert_id: options };

  const [existingRows] = await db.execute(
    `SELECT * FROM certificates WHERE student_id = ? AND batch_id = ?`, 
    [student_id, batch_id]
  );
  if (existingRows.length > 0) {
    return { 
      success: false, 
      error: 'Certificate already generated', 
      cert_id: existingRows[0].cert_id,
      exists: true
    };
  }

  const [detailsRows] = await db.execute(`
    SELECT s.name as student_name, s.email as student_email,
      b.name as batch_name, co.name as course_name, co.id as course_id,
      u.name as instructor_name, b.batch_status, b.archived_at,
      (SELECT COUNT(*) FROM attendance WHERE student_id = e.student_id AND batch_id = e.batch_id AND status = 'present') as present_count,
      b.duration_days
    FROM enrollments e
    JOIN users s ON e.student_id = s.id
    JOIN batches b ON e.batch_id = b.id
    JOIN courses co ON b.course_id = co.id
    LEFT JOIN users u ON b.instructor_id = u.id
    WHERE e.student_id = ? AND e.batch_id = ? AND e.status = 'approved'
  `, [student_id, batch_id]);

  const details = detailsRows[0];

  if (!details) return { success: false, error: 'Enrollment record not found or not approved' };

  // Compute student course progress percentage
  const duration = details.duration_days && details.duration_days > 0 ? details.duration_days : 30;
  const presentCount = details.present_count || 0;
  const studentPct = Math.min(100, Math.round((presentCount / duration) * 100));

  // Company settings & attendance threshold check
  const [settingsRows] = await db.execute('SELECT `key`, `value` FROM settings');
  const getSetting = (key, fallback = '') => {
    const s = settingsRows.find(row => row.key === key);
    return s ? s.value : fallback;
  };

  const minAttendanceSetting = parseFloat(getSetting('min_attendance_pct', '75'));
  const minAttendanceThreshold = isNaN(minAttendanceSetting) ? 75 : minAttendanceSetting;

  // Automatic eligibility requirement: Progress >= minAttendanceThreshold
  if (!is_admin_override && studentPct < minAttendanceThreshold) {
    return { 
      success: false, 
      error: `Student progress (${studentPct}%) is below the required ${minAttendanceThreshold}% threshold for automatic certificate generation.` 
    };
  }

  // Automatic eligibility requirement: Must pass all active assessments for the course
  if (!is_admin_override) {
    const [assessmentsRows] = await db.execute('SELECT id FROM assessments WHERE course_id = ? AND status = "active"', [details.course_id]);
    const totalAssessments = assessmentsRows.length;
    
    if (totalAssessments > 0) {
      const assessmentIds = assessmentsRows.map(row => row.id);
      const placeholders = assessmentIds.map(() => '?').join(',');
      
      const [passedRows] = await db.execute(`
        SELECT COUNT(DISTINCT assessment_id) as passed_count
        FROM assessment_attempts
        WHERE student_id = ? AND assessment_id IN (${placeholders}) AND is_passed = 1
      `, [student_id, ...assessmentIds]);

      const passedCount = passedRows[0].passed_count || 0;
      if (passedCount < totalAssessments) {
         return {
           success: false,
           error: `Student has only passed ${passedCount} of ${totalAssessments} required course assessments.`
         };
      }
    }
  }

  const siteName = getSetting('site_name', 'SnagUp Technologies');
  const siteUrlSetting = process.env.FRONTEND_URL || getSetting('site_url', 'http://localhost:3000');

  // Generate unique Certificate ID if not custom provided
  let cert_id = custom_cert_id;
  if (!cert_id) {
    const courseCode = (details.course_name || 'COURSE').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
    const year = new Date().getFullYear();
    await db.execute(`UPDATE settings SET \`value\` = \`value\` + 1 WHERE \`key\` = 'cert_counter'`);
    const [counterRows] = await db.execute(`SELECT \`value\` FROM settings WHERE \`key\` = 'cert_counter'`);
    const counter = parseInt(counterRows[0]?.value || '1', 10);
    cert_id = `SNAGUP-${courseCode}-${year}-${String(counter).padStart(6, '0')}`;
  }

  const verificationBase = siteUrlSetting.startsWith('http') ? siteUrlSetting : `https://${siteUrlSetting}`;
  const verificationUrl = `${verificationBase.replace(/\/$/, '')}/home?id=${cert_id}#verify`;

  // Generate QR code for certificate verification
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    margin: 1, color: { dark: '#0f2942', light: '#ffffff' }
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  // Dates: Enrollment Date & Completion Date (30 Days After Enrollment)
  const [enrollmentRows] = await db.execute(
    `SELECT enrolled_at as created_at FROM enrollments WHERE student_id = ? AND batch_id = ? LIMIT 1`,
    [student_id, batch_id]
  );
  const rawEnrollmentDate = enrollmentRows[0]?.created_at ? new Date(enrollmentRows[0].created_at) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rawCompletionDate = new Date(rawEnrollmentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const formatDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const enrollmentDateStr = formatDate(rawEnrollmentDate);
  const completionDateStr = formatDate(rawCompletionDate);
  const issuedDate = formatDate(new Date());

  // ── PDF Creation matching input_file_0.png Master Reference ──────────────────
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
  const pdfBufferPromise = new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const W = doc.page.width;   // ~841.89
  const H = doc.page.height;  // ~595.28

  const formatName = (str) => str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const formattedStudentName = formatName(details.student_name);

  // Background
  doc.rect(0, 0, W, H).fill('#ffffff');

  // Geometric Corner Accents (Matching SnagUp Brand Geometry)
  // Top-Left Blue Geometric Accent
  doc.save();
  doc.polygon([0, 0], [140, 0], [0, 140]).fill('#0284c7');
  doc.polygon([0, 0], [110, 0], [0, 110]).fill('#0369a1');
  doc.polygon([0, 0], [75, 0], [0, 75]).fill('#0f2942');
  doc.restore();

  // Bottom-Right Blue Geometric Accent
  doc.save();
  doc.polygon([W, H], [W - 140, H], [W, H - 140]).fill('#0284c7');
  doc.polygon([W, H], [W - 110, H], [W, H - 110]).fill('#0369a1');
  doc.polygon([W, H], [W - 75, H], [W, H - 75]).fill('#0f2942');
  doc.restore();

  // Outer & Inner Borders
  const bMargin = 16;
  doc.rect(bMargin, bMargin, W - bMargin * 2, H - bMargin * 2)
     .lineWidth(2)
     .strokeColor('#0f2942')
     .stroke();

  const iMargin = bMargin + 6;
  doc.rect(iMargin, iMargin, W - iMargin * 2, H - iMargin * 2)
     .lineWidth(1)
     .strokeColor('#0284c7')
     .stroke();

  // ── HEADER AREA ─────────────────────────────────────────────────────────────
  // Top-Left Branding Logo & Title
  const logoPath = path.join(__dirname, '../../public/brand-logo-v2.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 32, { width: 52 });
  }

  doc.fillColor('#0f2942').fontSize(20).font('Helvetica-Bold')
    .text('SnagUp', 110, 32);
  doc.fillColor('#0f2942').fontSize(7.5).font('Helvetica-Bold')
    .text('TECHNOLOGIES', 110, 54, { characterSpacing: 1.5 });

  // Divider Line
  doc.moveTo(215, 34).lineTo(215, 62).lineWidth(1).strokeColor('#cbd5e1').stroke();

  // Subtitle
  doc.fillColor('#475569').fontSize(8.5).font('Helvetica')
    .text('Student Skill\nDevelopment Platform', 225, 36);

  // Top-Right Slogan
  doc.fillColor('#1e40af').fontSize(8.5).font('Helvetica-Bold')
    .text('LEARN   /   BUILD   /   GROW', W - 280, 40, { width: 230, align: 'right', characterSpacing: 1.5 });

  // Top-Right Blue Ribbon Seal Badge
  const sealX = W - 90;
  const sealY = 95;
  const sealR = 34;

  // Ribbon Tails
  doc.save();
  doc.polygon([sealX - 18, sealY + 20], [sealX - 28, sealY + 65], [sealX - 18, sealY + 55], [sealX - 8, sealY + 65]).fill('#1d4ed8');
  doc.polygon([sealX + 18, sealY + 20], [sealX + 8, sealY + 65], [sealX + 18, sealY + 55], [sealX + 28, sealY + 65]).fill('#1e40af');
  doc.restore();

  // Outer Seal Circle (Dark Blue)
  doc.circle(sealX, sealY, sealR).fill('#0f2942');
  doc.circle(sealX, sealY, sealR - 3).lineWidth(1.5).strokeColor('#0284c7').stroke();
  doc.circle(sealX, sealY, sealR - 6).lineWidth(0.8).strokeColor('#ffffff').stroke();

  // Seal Text Inside
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
    .text('SNAG', sealX - 25, sealY - 18, { width: 50, align: 'center' });
  doc.fillColor('#ffffff').fontSize(4).font('Helvetica-Bold')
    .text('SNAGUP TECHNOLOGIES', sealX - 25, sealY + 2, { width: 50, align: 'center' });
  doc.fillColor('#ffffff').fontSize(6).font('Helvetica')
    .text('★ ★ ★', sealX - 25, sealY + 10, { width: 50, align: 'center' });

  // ── CERTIFICATE TITLE & PRESENTATION ─────────────────────────────────────────
  doc.fillColor('#0f2942').fontSize(26).font('Times-Bold')
    .text('CERTIFICATE  OF  COMPLETION', 0, 118, { width: W, align: 'center', characterSpacing: 1 });

  // Graduation Cap Vector Icon
  const capX = W / 2;
  const capY = 160;
  doc.save();
  doc.polygon([capX, capY - 8], [capX + 16, capY], [capX, capY + 8], [capX - 16, capY]).fill('#0f2942');
  doc.rect(capX - 7, capY + 4, 14, 6).fill('#0f2942');
  doc.restore();

  // Line below title
  doc.moveTo(W / 2 - 160, 178).lineTo(W / 2 + 160, 178).lineWidth(1).strokeColor('#0284c7').stroke();

  // Presentation Text
  doc.fillColor('#475569').fontSize(12).font('Helvetica')
    .text('This certificate is proudly presented to', 0, 196, { width: W, align: 'center' });

  // Student Name (Large Cursive / Serif Blue Font)
  doc.fillColor('#1d4ed8').fontSize(42).font('Times-BoldItalic')
    .text(formattedStudentName, 0, 222, { width: W, align: 'center' });

  // Line below name
  doc.moveTo(W / 2 - 180, 278).lineTo(W / 2 + 180, 278).lineWidth(1).strokeColor('#0284c7').opacity(0.7).stroke().opacity(1);

  // Completion Wording
  doc.fillColor('#475569').fontSize(11.5).font('Helvetica')
    .text('for successfully completing the', 0, 292, { width: W, align: 'center' });

  doc.fillColor('#0f2942').fontSize(22).font('Helvetica-Bold')
    .text(details.course_name, 0, 312, { width: W, align: 'center' });

  doc.fillColor('#475569').fontSize(10.5).font('Helvetica')
    .text('learning program conducted by ', 0, 342, { width: W, align: 'center' });
  doc.fillColor('#0f2942').fontSize(10.5).font('Helvetica-Bold')
    .text('SnagUp Technologies.', 0, 342, { width: W, align: 'center' });

  // ── BOTTOM METADATA CARDS (4 COLUMNS) ─────────────────────────────────────────
  const cardY = 380;
  const cardW = 150;
  const cardH = 50;
  const cardGap = 16;
  const startX = (W - (cardW * 4 + cardGap * 3)) / 2;

  const metadata = [
    { label: 'COURSE DURATION', val: `${details.duration_days || 30} Days`, sub: null },
    { label: 'ENROLLMENT DATE', val: enrollmentDateStr, sub: null },
    { label: 'COMPLETION DATE', val: completionDateStr, sub: '(30 Days After Enrollment)' },
    { label: 'CERTIFICATE ID', val: cert_id, sub: null }
  ];

  metadata.forEach((m, idx) => {
    const cx = startX + idx * (cardW + cardGap);

    // Border & Background
    doc.rect(cx, cardY, cardW, cardH).lineWidth(0.8).strokeColor('#e2e8f0').fill('#f8fafc');

    // Left Icon Placeholder Box
    doc.rect(cx + 8, cardY + 9, 32, 32).lineWidth(0.8).strokeColor('#0284c7').fill('#f0f9ff');
    doc.fillColor('#0284c7').fontSize(12).font('Helvetica-Bold')
      .text('✓', cx + 8, cardY + 16, { width: 32, align: 'center' });

    // Text Contents
    doc.fillColor('#64748b').fontSize(6.5).font('Helvetica-Bold')
      .text(m.label, cx + 46, cardY + 10, { width: cardW - 50 });

    doc.fillColor('#0f2942').fontSize(9.5).font('Helvetica-Bold')
      .text(m.val, cx + 46, cardY + 22, { width: cardW - 50 });

    if (m.sub) {
      doc.fillColor('#94a3b8').fontSize(5.5).font('Helvetica')
        .text(m.sub, cx + 46, cardY + 35, { width: cardW - 50 });
    }
  });

  // ── FOOTER AREA ─────────────────────────────────────────────────────────────
  const footerY = 465;

  // Left: Authorized Signatory
  // Signature Graphic Path
  doc.save();
  doc.moveTo(70, footerY + 20).bezierCurveTo(90, footerY, 110, footerY + 30, 130, footerY + 15).lineWidth(1.5).strokeColor('#0f2942').stroke();
  doc.restore();

  doc.fillColor('#0f2942').fontSize(10).font('Helvetica-Bold')
    .text('Authorized Signatory', 60, footerY + 32);
  doc.fillColor('#475569').fontSize(9).font('Helvetica')
    .text('SnagUp Technologies', 60, footerY + 45);

  // Center: Web Verification Domain
  const cleanDomain = siteUrlSetting.replace(/^https?:\/\//, '').replace(/\/$/, '');
  doc.fillColor('#0f2942').fontSize(9).font('Helvetica-Bold')
    .text(`🌐  ${cleanDomain}`, 0, footerY + 38, { width: W, align: 'center' });

  // Right: QR Code & Verification Subtitle
  const qrSize = 64;
  const qrX = W - 145;
  const qrY = footerY - 5;

  doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
  doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
    .text('Scan to verify\nthis certificate', qrX - 25, qrY + qrSize + 4, { width: qrSize + 50, align: 'center' });

  doc.end();
  const pdfBuffer = await pdfBufferPromise;

  let storedPdfPath = '';
  const supabase = getSupabaseClient();
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'snagup-files';

  if (supabase) {
    const storagePath = `certificates/${cert_id}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('💥 Supabase Certificate Storage Upload Error:', uploadError);
      return { 
        success: false, 
        error: `Failed to upload certificate PDF to cloud storage: ${uploadError.message}` 
      };
    }
    storedPdfPath = storagePath;
  } else {
    // Local filesystem fallback if Supabase client is unconfigured
    const certDir = path.join(__dirname, '../certs');
    if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });
    const localPdfPath = path.join(certDir, `${cert_id}.pdf`);
    fs.writeFileSync(localPdfPath, pdfBuffer);
    storedPdfPath = localPdfPath;
  }

  const releaseType = is_admin_override ? 'ADMIN_OVERRIDE' : 'AUTOMATIC';
  const certStatus = is_admin_override ? 'ISSUED' : 'ISSUED';

  await db.execute(`
    INSERT INTO certificates 
    (student_id, batch_id, cert_id, is_eligible, pdf_path, release_type, status, release_reason, released_by_admin_id, released_by_admin_name, progress_at_release) 
    VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      status = VALUES(status), 
      pdf_path = VALUES(pdf_path),
      release_type = VALUES(release_type),
      release_reason = VALUES(release_reason),
      released_by_admin_id = VALUES(released_by_admin_id),
      released_by_admin_name = VALUES(released_by_admin_name),
      issued_at = CURRENT_TIMESTAMP
  `, [
    student_id, batch_id, cert_id, storedPdfPath, releaseType, certStatus, 
    release_reason, admin_id, admin_name, studentPct
  ]);

  try {
    const actType = 'certificate_issued';
    const actDesc = is_admin_override 
      ? `Certificate ID: ${cert_id} issued by Admin for ${details.course_name}.`
      : `Certificate ID: ${cert_id} issued for ${details.course_name}.`;

    await db.execute(
      `INSERT INTO student_activities (student_id, title, description, activity_type) VALUES (?, ?, ?, ?)`,
      [student_id, `Certificate Released: ${details.course_name}`, actDesc, actType]
    );
  } catch (actErr) {
    console.error('Activity log error on cert generate:', actErr.message);
  }

  if (sendNotification && details.student_email) {
    notifyCertificateIssued(details.student_email, details.student_name, details.batch_name, cert_id).catch(console.error);
  }

  return { success: true, cert_id, pdf_path: storedPdfPath };
}

// ─── GET /api/certificates/verify/:cert_id — public ─────────────────────────
router.get('/verify/:cert_id', async (req, res) => {
  try {
    const [certRows] = await db.execute(`
      SELECT c.cert_id, c.issued_at, c.release_type, c.status,
        s.name as student_name,
        b.name as batch_name, b.duration_days,
        e.created_at as enrollment_date,
        co.name as course_name,
        u.name as instructor_name
      FROM certificates c
      JOIN users s ON c.student_id = s.id
      JOIN batches b ON c.batch_id = b.id
      JOIN courses co ON b.course_id = co.id
      LEFT JOIN users u ON b.instructor_id = u.id
      LEFT JOIN enrollments e ON (e.student_id = c.student_id AND e.batch_id = c.batch_id)
      WHERE c.cert_id = ?
    `, [req.params.cert_id]);

    const cert = certRows[0];

    if (!cert) {
      return res.status(404).json({ 
        error: 'Certificate Not Found', 
        message: 'The certificate ID could not be verified in the SnagUp certificate registry.' 
      });
    }

    const isRevoked = cert.status === 'REVOKED';

    const rawEnrDate = cert.enrollment_date ? new Date(cert.enrollment_date) : new Date(new Date(cert.issued_at).getTime() - 30 * 24 * 60 * 60 * 1000);
    const rawCompDate = new Date(rawEnrDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const formatDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    res.json({ 
      valid: !isRevoked, 
      status: isRevoked ? 'REVOKED' : 'VALID',
      message: isRevoked 
        ? 'This certificate was previously issued but is no longer considered valid.' 
        : 'Officially Verified Digital Credential issued by SnagUp Technologies.',
      certificate: {
        cert_id: cert.cert_id,
        student_name: cert.student_name,
        course_name: cert.course_name,
        batch_name: cert.batch_name,
        duration_days: cert.duration_days || 30,
        enrollment_date: formatDate(rawEnrDate),
        completion_date: formatDate(rawCompDate),
        issued_at: formatDate(new Date(cert.issued_at)),
        instructor_name: cert.instructor_name || 'SnagUp Academic Director',
        status: isRevoked ? 'REVOKED' : 'VALID'
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

// ─── POST /api/certificates/admin/release — admin manual override ────────────
router.post('/admin/release', authenticateToken, requireRole('admin'), async (req, res) => {
  const { student_id, batch_id, release_reason } = req.body;

  if (!student_id || !batch_id) {
    return res.status(400).json({ error: 'Missing student_id or batch_id' });
  }

  const reasonText = (typeof release_reason === 'string' && release_reason.trim()) 
    ? release_reason.trim() 
    : 'Admin Authorized Issuance';

  try {
    const result = await generateCertificateInternal(student_id, batch_id, {
      is_admin_override: true,
      release_reason: reasonText,
      admin_id: req.user.id,
      admin_name: req.user.name
    });

    if (!result.success) {
      if (result.error === 'Certificate already generated' && result.cert_id) {
        return res.json({ message: 'Certificate already issued', cert_id: result.cert_id, exists: true });
      }
      return res.status(400).json({ error: result.error, cert_id: result.cert_id });
    }

    res.json({ message: 'Certificate officially issued by Admin', cert_id: result.cert_id, exists: false });
  } catch (err) {
    console.error('Admin Certificate Release Error:', err);
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
});

// ─── POST /api/certificates/generate — student or admin ──────────────────────
router.post('/generate', authenticateToken, async (req, res) => {
  let { student_id, batch_id } = req.body;

  if (req.user.role === 'student') {
    student_id = req.user.id;
  } else if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!student_id || !batch_id) return res.status(400).json({ error: 'Missing student_id or batch_id' });

  try {
    // Check if certificate has been approved/issued by admin
    const [certRows] = await db.execute(`SELECT * FROM certificates WHERE student_id = ? AND batch_id = ?`, [student_id, batch_id]);
    const existingCert = certRows[0];

    if (req.user.role === 'student') {
      if (!existingCert || existingCert.status === 'PENDING') {
        return res.status(403).json({ error: 'Certificate Pending Admin Approval. Download will be unlocked once approved by Admin.' });
      }
      if (existingCert.status === 'REVOKED') {
        return res.status(403).json({ error: 'This certificate has been revoked.' });
      }
    }

    const result = await generateCertificateInternal(student_id, batch_id, {
      is_admin_override: req.user.role === 'admin'
    });

    if (!result.success) {
      if (result.error === 'Certificate already generated' && result.cert_id) {
        return res.json({ message: 'Certificate already issued', cert_id: result.cert_id, exists: true });
      }
      return res.status(400).json({ error: result.error, cert_id: result.cert_id });
    }

    res.json({ message: 'Certificate generated successfully', cert_id: result.cert_id, exists: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// ─── POST /api/certificates/regenerate — student re-generates existing PDF ──
router.post('/regenerate', authenticateToken, async (req, res) => {
  const { batch_id } = req.body;
  if (req.user.role !== 'student' && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  if (!batch_id) return res.status(400).json({ error: 'Missing batch_id' });

  const student_id = req.user.role === 'student' ? req.user.id : req.body.student_id;

  try {
    const [existingRows] = await db.execute(`SELECT * FROM certificates WHERE student_id = ? AND batch_id = ?`, [student_id, batch_id]);
    const existing = existingRows[0];
    
    if (!existing) return res.status(404).json({ error: 'No certificate found to regenerate' });

    if (req.user.role === 'student' && existing.status === 'REVOKED') {
      return res.status(403).json({ error: 'Cannot regenerate a revoked certificate.' });
    }

    const originalCertId = existing.cert_id;
    const isOverride = existing.release_type === 'ADMIN_OVERRIDE';
    const reason = existing.release_reason;
    const adminId = existing.released_by_admin_id;
    const adminName = existing.released_by_admin_name;

    const oldPdf = existing.pdf_path || path.join(__dirname, '../certs', `${originalCertId}.pdf`);
    if (oldPdf && fs.existsSync(oldPdf)) {
      try { fs.unlinkSync(oldPdf); } catch (_) {}
    }

    const result = await generateCertificateInternal(student_id, batch_id, {
      custom_cert_id: originalCertId,
      sendNotification: false,
      is_admin_override: isOverride,
      release_reason: reason,
      admin_id: adminId,
      admin_name: adminName
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ message: 'Certificate PDF regenerated', cert_id: result.cert_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to regenerate certificate' });
  }
});

// ─── GET /api/certificates/admin/all — admin only ────────────────────────────
router.get('/admin/all', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [certs] = await db.execute(`
      SELECT c.*, 
             c.release_type, c.status as cert_status, c.release_reason,
             c.released_by_admin_id, c.released_by_admin_name, c.progress_at_release,
             u.name as student_name, u.email as student_email, 
             b.name as batch_name, co.name as course_name, b.duration_days,
             (SELECT COUNT(*) FROM attendance WHERE student_id = c.student_id AND batch_id = c.batch_id AND status = 'present') as present_count
      FROM certificates c
      JOIN users u ON c.student_id = u.id
      JOIN batches b ON c.batch_id = b.id
      JOIN courses co ON b.course_id = co.id
      ORDER BY c.issued_at DESC
    `);
    res.json(certs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// ─── DELETE /api/certificates/admin/:id — admin revoke certificate ────────────
router.delete('/admin/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Revoke certificate by setting status='REVOKED' (Preserves record for verification url)
    await db.execute(`UPDATE certificates SET status = 'REVOKED' WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Certificate officially revoked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to revoke certificate' });
  }
});

// ─── GET /api/certificates/download/:cert_id ──────────────────────────────────
router.get('/download/:cert_id', async (req, res) => {
  try {
    const certId = req.params.cert_id;
    const [certRows] = await db.execute(
      `SELECT * FROM certificates WHERE cert_id = ?`,
      [certId]
    );
    const cert = certRows[0];

    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (cert.status === 'REVOKED') {
      return res.status(403).json({ error: 'This certificate has been revoked' });
    }

    const storedPath = cert.pdf_path || `certificates/${cert.cert_id}.pdf`;

    // If it's a Supabase storage relative path or if local file doesn't exist
    if (storedPath.startsWith('certificates/') || !fs.existsSync(storedPath)) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'snagup-files';
        const storagePath = storedPath.startsWith('certificates/')
          ? storedPath
          : `certificates/${cert.cert_id}.pdf`;

        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(storagePath, 300);

        if (error || !data?.signedUrl) {
          console.error('Signed URL generation error:', error);
          return res.status(500).json({ error: 'Failed to generate download link' });
        }

        return res.redirect(data.signedUrl);
      }
    }

    // Local filesystem fallback for old legacy certificates
    if (fs.existsSync(storedPath)) {
      return res.sendFile(path.resolve(storedPath));
    }

    return res.status(404).json({ error: 'Certificate storage file missing' });
  } catch (err) {
    console.error('Certificate Download Error:', err);
    res.status(500).json({ error: 'Failed to process certificate download' });
  }
});

module.exports = { router, generateCertificateInternal };
