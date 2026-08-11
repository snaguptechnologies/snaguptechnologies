const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { notifyCertificateIssued } = require('../lib/emailService');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// ─── Certificate generation ───────────────────────────────────────────────────
async function generateCertificateInternal(student_id, batch_id, custom_cert_id = null, sendNotification = true) {
  const [existingRows] = await db.execute(`SELECT * FROM certificates WHERE student_id = ? AND batch_id = ?`, [student_id, batch_id]);
  if (existingRows.length > 0) return { success: false, error: 'Certificate already generated', cert_id: existingRows[0].cert_id };

  const [detailsRows] = await db.execute(`
    SELECT s.name as student_name, b.name as batch_name, co.name as course_name,
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
  if (details.batch_status !== 'completed') return { success: false, error: 'Batch is not completed' };
  if (!details.archived_at) return { success: false, error: 'Certificates can only be generated after the batch is archived.' };

  const [minPctRows] = await db.execute("SELECT \`value\` FROM settings WHERE \`key\` = 'min_attendance_pct'");
  const minPct = parseInt(minPctRows[0]?.value || '75', 10);
  const studentPct = details.duration_days > 0 ? (details.present_count / details.duration_days) * 100 : 100;
  if (studentPct < minPct) {
    return { success: false, error: `Attendance (${Math.round(studentPct)}%) below requirement (${minPct}%)` };
  }

  // Company settings
  const [settingsRows] = await db.execute('SELECT \`key\`, \`value\` FROM settings');
  const getSetting = (key, fallback = '') => {
    const s = settingsRows.find(row => row.key === key);
    return s ? s.value : fallback;
  };

  const siteName     = getSetting('site_name',     'Snagup Technologies');
  const siteUrlSetting = process.env.FRONTEND_URL || getSetting('site_url', 'http://localhost:3000');
  
  // Generate cert ID (only if not provided)
  let cert_id = custom_cert_id;
  if (!cert_id) {
    const year = new Date().getFullYear();
    await db.execute(`UPDATE settings SET \`value\` = \`value\` + 1 WHERE \`key\` = 'cert_counter'`);
    const [counterRows] = await db.execute(`SELECT \`value\` FROM settings WHERE \`key\` = 'cert_counter'`);
    const counter = parseInt(counterRows[0].value);
    cert_id = `SNAGUP-${year}-${String(counter).padStart(4, '0')}`;
  }

  const verificationBase = siteUrlSetting.startsWith('http') ? siteUrlSetting : `https://${siteUrlSetting}`;
  const verificationUrl = `${verificationBase.replace(/\/$/, '')}/home?id=${cert_id}#verify`;

  const certDir = path.join(__dirname, '../certs');
  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir);
  const pdfPath = path.join(certDir, `${cert_id}.pdf`);

  // QR code — navy dots on cream background
  // Linking to the home page verification section
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    margin: 1, color: { dark: '#1e1b4b', light: '#f5f0e8' }
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  const issuedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  const W = doc.page.width;   // ~841
  const H = doc.page.height;  // ~595

  // ── Helper: Title Case Formatting ──────────────────────────────
  const formatName = (str) => str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const formattedStudentName = formatName(details.student_name);

  // ── 1. BACKGROUND (Pure White) ──────────────────────────────────
  doc.rect(0, 0, W, H).fill('#ffffff');

  // ── 2. GEOMETRIC BORDER (Simple & Aligned) ───────────────────────
  const borderMargin = 20;
  const goldenYellow = '#FFB800';
  
  // Outer Thick Black Border
  doc.rect(borderMargin, borderMargin, W - borderMargin*2, H - borderMargin*2)
     .lineWidth(8)
     .strokeColor('#000000')
     .stroke();

  // Inner Thin Gold Border (Inset)
  const innerMargin = borderMargin + 10;
  doc.rect(innerMargin, innerMargin, W - innerMargin*2, H - innerMargin*2)
     .lineWidth(2)
     .strokeColor(goldenYellow)
     .stroke();

  // ── 3. TOP BRANDING ──────────────────────────────────────────────
  const logoPath = path.join(__dirname, '../../public/brand-logo-v2.png');
  const logoW = 80;
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, (W - logoW) / 2, 50, { width: logoW });
  }

  doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold')
    .text(siteName.toUpperCase(), 0, 135, { width: W, align: 'center', characterSpacing: 2 });

  // ── 4. MAIN TITLES ───────────────────────────────────────────────
  doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold')
    .text('CERTIFICATE OF', 0, 190, { width: W, align: 'center', characterSpacing: 4 });

  doc.fillColor('#000000').fontSize(42).font('Times-Bold')
    .text('COURSE COMPLETION', 0, 215, { width: W, align: 'center', characterSpacing: 1 });

  // ── 5. NARRATIVE TEXT ────────────────────────────────────────────
  doc.fillColor('#666666').fontSize(12).font('Helvetica')
    .text('This is proudly presented to', 0, 290, { width: W, align: 'center' });

  // ── 6. STUDENT NAME (Centered & Impactful) ───────────────────────
  doc.fillColor(goldenYellow).fontSize(56).font('Times-BoldItalic')
    .text(formattedStudentName, 0, 315, { width: W, align: 'center' });

  // Subtle separator line below name
  doc.moveTo(W/2 - 120, 385).lineTo(W/2 + 120, 385).lineWidth(1).strokeColor(goldenYellow).opacity(0.4).stroke().opacity(1);

  // ── 7. COURSE DETAILS ────────────────────────────────────────────
  doc.fillColor('#666666').fontSize(12).font('Helvetica')
    .text('for successfully completing the course of study in', 0, 410, { width: W, align: 'center' });

  doc.fillColor('#000000').fontSize(26).font('Helvetica-Bold')
    .text(details.course_name.toUpperCase(), 0, 440, { width: W, align: 'center' });

  doc.fillColor('#666666').fontSize(12).font('Helvetica')
    .text(`Date of Achievement: ${issuedDate}`, 0, 490, { width: W, align: 'center' });

  // ── 8. FOOTER SECTIONS (Seal Left, ID/QR Right) ─────────────────
  const footerY = 510; // Slightly raised
  const sealX = 130; // Slightly further in
  const sealR = 45; // Slightly larger for impact

  // ── 8a. Left Side: Authorization Seal (Premium Masterpiece Design)
  const numPoints = 72; // High precision scalloping
  const outerR = sealR;
  const innerR = sealR - 3;
  const deepGold = '#B18B21';
  const midGold  = '#D4AF37';
  const lightGold = '#F9E27D';

  doc.save();
  
  // 1. SCALLOPED BORDER WITH METALLIC GRADIENT
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

  // 2. CONCENTRIC INNER RINGS (MINTED DETAIL)
  doc.circle(sealX, footerY, sealR - 6).lineWidth(1.5).strokeColor(lightGold).opacity(0.8).stroke();
  doc.circle(sealX, footerY, sealR - 8).lineWidth(0.5).strokeColor(deepGold).opacity(0.4).stroke();
  doc.circle(sealX, footerY, sealR - 12).lineWidth(1.2).strokeColor(lightGold).opacity(0.6).stroke();
  doc.opacity(1);

  // 3. CURVED TYPOGRAPHY: BALANCED ARC SYSTEM
  const drawCurvedText = (text, radius, centerAngle, isReversed = false) => {
    doc.save()
       .translate(sealX, footerY)
       .font('Helvetica-Bold')
       .fontSize(5.5)
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
        doc.rotate(180); // Flip upright
        doc.text(char, -charWidth / 2, radius - 2); 
      } else {
        doc.text(char, -charWidth / 2, -radius);
      }
      
      doc.restore();
      currentAngle += isReversed ? -(charAngle + spacingAngle) : (charAngle + spacingAngle);
    }
    doc.restore();
  };

  // Top Arc: Centered at -90 degrees (-PI/2)
  drawCurvedText('OFFICIALLY VERIFIED', sealR - 11, -Math.PI/2);
  
  // Bottom Arc: Centered at 90 degrees (PI/2)
  drawCurvedText('SNAGUP TECHNOLOGIES', sealR - 11, Math.PI/2, true);

  // 4. CENTRAL GRAPHIC (ENHANCED FIVE-POINTED STAR)
  const starCenterGrad = doc.radialGradient(sealX, footerY, 2, sealX, footerY, 15);
  starCenterGrad.stop(0, lightGold).stop(1, deepGold);
  
  const starR = 10;
  doc.save();
  doc.translate(sealX, footerY);
  doc.moveTo(0, -starR);
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    doc.lineTo(Math.cos(angle + (4 * Math.PI / 5)) * starR, Math.sin(angle + (4 * Math.PI / 5)) * starR);
  }
  doc.closePath().fill(starCenterGrad);
  
  // Outer glowing ring for star
  doc.circle(0, 0, starR + 3).lineWidth(0.3).strokeColor(lightGold).opacity(0.5).stroke();
  doc.restore();

  doc.restore();

  // ── 8b. Right Side: QR Code & Certificate ID
  const qrSize = 70;
  const sideMargin = 70;
  const rightX = W - sideMargin - qrSize;
  
  // QR Code Image
  doc.image(qrBuffer, rightX, footerY - 45, { width: qrSize });
  
  // Certificate ID (Positioned BELOW QR code)
  doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold')
    .text(`ID: ${cert_id}`, rightX - 25, footerY + 30, { width: qrSize + 50, align: 'center' });

  // ── 9. CENTER FOOTER: VERIFICATION LINK ──────────────────────────────
  doc.fillColor('#666666').fontSize(8).font('Helvetica')
    .text('Verification: Visit verification section in the home page', 0, footerY + 45, { width: W, align: 'center' });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  await db.execute(`INSERT INTO certificates (student_id, batch_id, cert_id, is_eligible, pdf_path) VALUES (?, ?, ?, 1, ?)`,
    [student_id, batch_id, cert_id, pdfPath]);

  try {
    await db.execute(
      `INSERT INTO student_activities (student_id, title, description, activity_type) VALUES (?, ?, ?, 'certificate_issued')`,
      [student_id, `Certificate Issued: ${details.course_name}`, `Certificate ID: ${cert_id} issued for ${details.course_name} (${details.batch_name}).`]
    );
  } catch (actErr) {
    console.error('Activity log error on cert generate:', actErr.message);
  }


  const [studentRows] = await db.execute('SELECT email, name FROM users WHERE id = ?', [student_id]);
  const student = studentRows[0];
  if (sendNotification && student && student.email) {
    notifyCertificateIssued(student.email, student.name, details.batch_name, cert_id).catch(console.error);
  }

  return { success: true, cert_id, pdf_path: pdfPath };
}

// ─── GET /api/certificates/verify/:cert_id — public ─────────────────────────
router.get('/verify/:cert_id', async (req, res) => {
  try {
    const [certRows] = await db.execute(`
      SELECT c.cert_id, c.issued_at,
        s.name as student_name,
        b.name as batch_name, b.duration_days, b.price,
        co.name as course_name,
        u.name as instructor_name
      FROM certificates c
      JOIN users s ON c.student_id = s.id
      JOIN batches b ON c.batch_id = b.id
      JOIN courses co ON b.course_id = co.id
      LEFT JOIN users u ON b.instructor_id = u.id
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



// ─── POST /api/certificates/regenerate — student re-generates their cert ──────
router.post('/regenerate', authenticateToken, async (req, res) => {
  const { batch_id } = req.body;
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only' });
  if (!batch_id) return res.status(400).json({ error: 'Missing batch_id' });

  try {
    const [existingRows] = await db.execute(`SELECT * FROM certificates WHERE student_id = ? AND batch_id = ?`, [req.user.id, batch_id]);
    const existing = existingRows[0];
    
    if (!existing) return res.status(404).json({ error: 'No certificate found to regenerate' });

    const originalCertId = existing.cert_id;

    const oldPdf = existing.pdf_path || path.join(__dirname, '../certs', `${originalCertId}.pdf`);
    if (oldPdf && fs.existsSync(oldPdf)) {
      try { fs.unlinkSync(oldPdf); } catch (_) {}
    }

    await db.execute(`DELETE FROM certificates WHERE student_id = ? AND batch_id = ?`, [req.user.id, batch_id]);

    const result = await generateCertificateInternal(req.user.id, batch_id, originalCertId, false);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ message: 'Certificate regenerated', cert_id: result.cert_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to regenerate certificate' });
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
    const result = await generateCertificateInternal(student_id, batch_id);
    if (!result.success) {
      if (result.error === 'Certificate already generated' && result.cert_id) {
        return res.json({ message: 'Certificate already exists', cert_id: result.cert_id, exists: true });
      }
      return res.status(400).json({ error: result.error, cert_id: result.cert_id });
    }

    res.json({ message: 'Certificate generated', cert_id: result.cert_id, exists: false });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// ─── GET /api/certificates/admin/all — admin only ────────────────────────────
router.get('/admin/all', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [certs] = await db.execute(`
      SELECT c.*, u.name as student_name, u.email as student_email, 
             b.name as batch_name, co.name as course_name
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
