const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { notifyCertificateIssued } = require('../lib/emailService');
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
      b.name as batch_name, co.name as course_name,
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

  // Automatic eligibility requirement: Progress >= 80%
  if (!is_admin_override && studentPct < 80) {
    return { 
      success: false, 
      error: `Student progress (${studentPct}%) is below the required 80% threshold for automatic certificate generation.` 
    };
  }

  // Company settings
  const [settingsRows] = await db.execute('SELECT \`key\`, \`value\` FROM settings');
  const getSetting = (key, fallback = '') => {
    const s = settingsRows.find(row => row.key === key);
    return s ? s.value : fallback;
  };

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

  const certDir = path.join(__dirname, '../certs');
  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });
  const pdfPath = path.join(certDir, `${cert_id}.pdf`);

  // Generate QR code for certificate verification
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    margin: 1, color: { dark: '#1e1b4b', light: '#ffffff' }
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  const issuedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── PDF Creation ─────────────────────────────────────────────────────────────
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  const W = doc.page.width;   // ~841
  const H = doc.page.height;  // ~595

  const formatName = (str) => str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const formattedStudentName = formatName(details.student_name);

  // Background
  doc.rect(0, 0, W, H).fill('#ffffff');

  // Outer Thick Border & Inner Gold Border
  const borderMargin = 20;
  const goldenYellow = '#FFB800';

  doc.rect(borderMargin, borderMargin, W - borderMargin * 2, H - borderMargin * 2)
     .lineWidth(8)
     .strokeColor('#0f172a')
     .stroke();

  const innerMargin = borderMargin + 10;
  doc.rect(innerMargin, innerMargin, W - innerMargin * 2, H - innerMargin * 2)
     .lineWidth(2)
     .strokeColor(goldenYellow)
     .stroke();

  // Branding Logo
  const logoPath = path.join(__dirname, '../../public/brand-logo-v2.png');
  const logoW = 80;
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, (W - logoW) / 2, 45, { width: logoW });
  }

  doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold')
    .text(siteName.toUpperCase(), 0, 130, { width: W, align: 'center', characterSpacing: 2 });

  // Main Titles
  doc.fillColor('#64748b').fontSize(11).font('Helvetica-Bold')
    .text('CERTIFICATE OF ACHIEVEMENT', 0, 180, { width: W, align: 'center', characterSpacing: 4 });

  doc.fillColor('#0f172a').fontSize(38).font('Times-Bold')
    .text('COURSE COMPLETION', 0, 205, { width: W, align: 'center', characterSpacing: 1 });

  // Presentation text
  doc.fillColor('#475569').fontSize(12).font('Helvetica')
    .text('This certificate is proudly presented to', 0, 275, { width: W, align: 'center' });

  // Student Name
  doc.fillColor(goldenYellow).fontSize(50).font('Times-BoldItalic')
    .text(formattedStudentName, 0, 300, { width: W, align: 'center' });

  // Subtle separator line below name
  doc.moveTo(W / 2 - 120, 365).lineTo(W / 2 + 120, 365).lineWidth(1).strokeColor(goldenYellow).opacity(0.5).stroke().opacity(1);

  // Wording: Standard compliant wording suitable for >=80% threshold
  doc.fillColor('#475569').fontSize(12).font('Helvetica')
    .text('for successfully meeting the required learning criteria in', 0, 390, { width: W, align: 'center' });

  doc.fillColor('#0f172a').fontSize(24).font('Helvetica-Bold')
    .text(details.course_name.toUpperCase(), 0, 418, { width: W, align: 'center' });

  doc.fillColor('#64748b').fontSize(10).font('Helvetica-Oblique')
    .text('The learner achieved the required learning progress threshold.', 0, 460, { width: W, align: 'center' });

  doc.fillColor('#475569').fontSize(11).font('Helvetica')
    .text(`Date of Achievement: ${issuedDate}`, 0, 485, { width: W, align: 'center' });

  // Footer / Seal & QR Code
  const footerY = 510;
  const sealX = 130;
  const sealR = 42;

  const numPoints = 72;
  const outerR = sealR;
  const innerR = sealR - 3;
  const deepGold = '#B18B21';
  const midGold  = '#D4AF37';
  const lightGold = '#F9E27D';

  doc.save();

  const sealGrad = doc.linearGradient(sealX - sealR, footerY - sealR, sealX + sealR, footerY + sealR);
  sealGrad.stop(0, deepGold).stop(0.2, lightGold).stop(0.5, midGold).stop(0.8, lightGold).stop(1, deepGold);

  doc.moveTo(sealX + outerR, footerY);
  for (let i = 1; i <= numPoints * 2; i++) {
    const angle = (i * Math.PI) / numPoints;
    const r = i % 2 === 0 ? outerR : innerR;
    doc.lineTo(sealX + Math.cos(angle) * r, footerY + Math.sin(angle) * r);
  }
  doc.closePath().fill(sealGrad);
  doc.strokeColor(deepGold).lineWidth(0.5).stroke();

  doc.circle(sealX, footerY, sealR - 6).lineWidth(1.5).strokeColor(lightGold).opacity(0.8).stroke();
  doc.circle(sealX, footerY, sealR - 8).lineWidth(0.5).strokeColor(deepGold).opacity(0.4).stroke();
  doc.circle(sealX, footerY, sealR - 12).lineWidth(1.2).strokeColor(lightGold).opacity(0.6).stroke();
  doc.opacity(1);

  const drawCurvedText = (text, radius, centerAngle, isReversed = false) => {
    doc.save()
       .translate(sealX, footerY)
       .font('Helvetica-Bold')
       .fontSize(5)
       .fillColor(deepGold);

    const charSpacing = 1.8; 
    let totalWidth = 0;
    for (let char of text) {
      totalWidth += doc.widthOfString(char) + charSpacing;
    }
    const totalAngle = totalWidth / radius;
    let currentAngle = isReversed ? (centerAngle + totalAngle / 2) : (centerAngle - totalAngle / 2);

    for (let char of text) {
      const charWidth = doc.widthOfString(char);
      const charAngle = charWidth / radius;
      const spacingAngle = charSpacing / radius;
      const midAngle = isReversed ? (currentAngle - charAngle / 2) : (currentAngle + charAngle / 2);

      doc.save();
      doc.rotate(midAngle * (180 / Math.PI));
      if (isReversed) {
        doc.rotate(180);
        doc.text(char, -charWidth / 2, radius - 2); 
      } else {
        doc.text(char, -charWidth / 2, -radius);
      }
      doc.restore();
      currentAngle += isReversed ? -(charAngle + spacingAngle) : (charAngle + spacingAngle);
    }
    doc.restore();
  };

  drawCurvedText('OFFICIALLY VERIFIED', sealR - 11, -Math.PI / 2);
  drawCurvedText('SNAGUP TECHNOLOGIES', sealR - 11, Math.PI / 2, true);

  const starR = 9;
  doc.save();
  doc.translate(sealX, footerY);
  doc.moveTo(0, -starR);
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    doc.lineTo(Math.cos(angle + (4 * Math.PI / 5)) * starR, Math.sin(angle + (4 * Math.PI / 5)) * starR);
  }
  doc.closePath().fill(deepGold);
  doc.restore();
  doc.restore();

  // QR Code & Cert ID on Bottom Right
  const qrSize = 65;
  const sideMargin = 70;
  const rightX = W - sideMargin - qrSize;

  doc.image(qrBuffer, rightX, footerY - 45, { width: qrSize });
  doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold')
    .text(`ID: ${cert_id}`, rightX - 35, footerY + 25, { width: qrSize + 70, align: 'center' });

  // Center Footer Verification Note
  doc.fillColor('#64748b').fontSize(8).font('Helvetica')
    .text('Official Digital Credential • Verify online at SnagUp Technologies', 0, footerY + 45, { width: W, align: 'center' });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const releaseType = is_admin_override ? 'ADMIN_OVERRIDE' : 'AUTOMATIC';
  const certStatus = is_admin_override ? 'ADMIN_RELEASED' : 'GENERATED';

  await db.execute(`
    INSERT INTO certificates 
    (student_id, batch_id, cert_id, is_eligible, pdf_path, release_type, status, release_reason, released_by_admin_id, released_by_admin_name, progress_at_release) 
    VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
  `, [
    student_id, batch_id, cert_id, pdfPath, releaseType, certStatus, 
    release_reason, admin_id, admin_name, studentPct
  ]);

  try {
    const actType = is_admin_override ? 'certificate_issued' : 'certificate_issued';
    const actDesc = is_admin_override 
      ? `Certificate ID: ${cert_id} manually released by Admin for ${details.course_name}.`
      : `Certificate ID: ${cert_id} automatically issued for ${details.course_name}.`;

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

  return { success: true, cert_id, pdf_path: pdfPath };
}

// ─── GET /api/certificates/verify/:cert_id — public ─────────────────────────
router.get('/verify/:cert_id', async (req, res) => {
  try {
    const [certRows] = await db.execute(`
      SELECT c.cert_id, c.issued_at, c.release_type, c.status,
        s.name as student_name,
        b.name as batch_name, b.duration_days,
        co.name as course_name
      FROM certificates c
      JOIN users s ON c.student_id = s.id
      JOIN batches b ON c.batch_id = b.id
      JOIN courses co ON b.course_id = co.id
      WHERE c.cert_id = ?
    `, [req.params.cert_id]);

    const cert = certRows[0];

    if (!cert) return res.status(404).json({ error: 'Certificate not found or invalid' });
    res.json({ valid: true, certificate: cert });
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

  if (!release_reason || typeof release_reason !== 'string' || !release_reason.trim()) {
    return res.status(400).json({ error: 'A short reason is required for manual certificate release.' });
  }

  try {
    const result = await generateCertificateInternal(student_id, batch_id, {
      is_admin_override: true,
      release_reason: release_reason.trim(),
      admin_id: req.user.id,
      admin_name: req.user.name
    });

    if (!result.success) {
      if (result.error === 'Certificate already generated' && result.cert_id) {
        return res.json({ message: 'Certificate already exists', cert_id: result.cert_id, exists: true });
      }
      return res.status(400).json({ error: result.error, cert_id: result.cert_id });
    }

    res.json({ message: 'Certificate manually released by Admin', cert_id: result.cert_id, exists: false });
  } catch (err) {
    console.error('Admin Certificate Release Error:', err);
    res.status(500).json({ error: 'Failed to manually release certificate' });
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
    const result = await generateCertificateInternal(student_id, batch_id, {
      is_admin_override: req.user.role === 'admin' ? false : false
    });

    if (!result.success) {
      if (result.error === 'Certificate already generated' && result.cert_id) {
        return res.json({ message: 'Certificate already exists', cert_id: result.cert_id, exists: true });
      }
      return res.status(400).json({ error: result.error, cert_id: result.cert_id });
    }

    res.json({ message: 'Certificate generated', cert_id: result.cert_id, exists: false });
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

    const originalCertId = existing.cert_id;
    const isOverride = existing.release_type === 'ADMIN_OVERRIDE';
    const reason = existing.release_reason;
    const adminId = existing.released_by_admin_id;
    const adminName = existing.released_by_admin_name;

    const oldPdf = existing.pdf_path || path.join(__dirname, '../certs', `${originalCertId}.pdf`);
    if (oldPdf && fs.existsSync(oldPdf)) {
      try { fs.unlinkSync(oldPdf); } catch (_) {}
    }

    await db.execute(`DELETE FROM certificates WHERE student_id = ? AND batch_id = ?`, [student_id, batch_id]);

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
    res.json({ message: 'Certificate regenerated', cert_id: result.cert_id });
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

// ─── DELETE /api/certificates/admin/:id — admin only ─────────────────────────
router.delete('/admin/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [certRows] = await db.execute(`SELECT pdf_path FROM certificates WHERE id = ?`, [req.params.id]);
    const cert = certRows[0];
    if (cert && cert.pdf_path && fs.existsSync(cert.pdf_path)) {
      try { fs.unlinkSync(cert.pdf_path); } catch (_) {}
    }
    await db.execute(`DELETE FROM certificates WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Certificate revoked and record deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

module.exports = { router, generateCertificateInternal };
