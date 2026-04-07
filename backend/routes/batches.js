const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  notifyStudentsOfSessionLink,
  notifyEnrollmentOpened,
  notifyVerificationPending,
  notifyCertificateFinalized
} = require('../lib/emailService');
const { generateCertificateInternal } = require('./certificates');

// Helper: IST-aware current datetime string (YYYY-MM-DD HH:mm:ss)
function nowIST() {
  const d = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

// Helper: IST-aware today's date string (YYYY-MM-DD)
function todayIST() {
  return nowIST().slice(0, 10);
}

// Helper: IST-aware datetime N hours from now (YYYY-MM-DD HH:mm:ss)
function futureIST(ms) {
  const d = new Date(new Date().getTime() + ms + (5.5 * 60 * 60 * 1000));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

// Helper: Notify waitlist students when enrollment opens
const triggerWaitlistNotifications = async (batchId) => {
  const [rows] = await db.execute(`
    SELECT b.name AS batch_name, b.enrollment_end_date, c.name AS course_name 
    FROM batches b
    JOIN courses c ON b.course_id = c.id
    WHERE b.id = ?
  `, [batchId]);
  const updatedBatch = rows[0];

  if (!updatedBatch) return;

  const [waitlisted] = await db.execute(`
    SELECT u.email FROM waitlist w
    JOIN users u ON w.student_id = u.id
    WHERE w.batch_id = ?
  `, [batchId]);

  if (waitlisted.length > 0) {
    console.log(`[VERIFICATION] Notifying ${waitlisted.length} students for batch ${batchId}`);
    notifyEnrollmentOpened(waitlisted, updatedBatch.course_name, updatedBatch.batch_name, updatedBatch.enrollment_end_date).catch(console.error);
    await db.execute('DELETE FROM waitlist WHERE batch_id = ?', [batchId]);
  } else {
    console.log(`[VERIFICATION] No students to notify for batch ${batchId}`);
  }
};

// GET /api/batches - public: shows all upcoming/active batches; admin uses ?all=true for archived too
router.get('/', async (req, res) => {
  const showAll = req.query.all === 'true';
  const now = nowIST();

  // Auto-close expired enrollments
  try {
    const [info] = await db.execute(`
      UPDATE batches 
      SET enrollment_status = 'closed' 
      WHERE enrollment_status = 'open' 
        AND enrollment_end_date IS NOT NULL 
        AND enrollment_end_date <= ?
    `, [now]);
    if (info.affectedRows > 0) {
      console.log(`[SYSTEM] Auto-closed ${info.affectedRows} expired batch enrollments at ${now}`);
    }
  } catch(err) {
    console.error('[SYSTEM] Error auto-closing expired enrollments:', err);
  }

  let query = `
    SELECT b.*, c.name as course_name, u.name as instructor_name,
      (SELECT COUNT(*) FROM enrollments WHERE batch_id=b.id AND status='approved') as enrolled_count
    FROM batches b
    JOIN courses c ON b.course_id = c.id
    LEFT JOIN users u ON b.instructor_id = u.id
  `;

  if (!showAll) {
    query += ` WHERE b.batch_status IN ('upcoming', 'active') `;
  }

  query += ` ORDER BY b.created_at DESC `;

  try {
    const [batches] = await db.execute(query);
    res.json(batches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// POST /api/batches - admin only (Simplified: auto-increments batch name for course)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  let { course_id, instructor_id, duration_days, price, enrollment_end_date } = req.body;
  if (!course_id) return res.status(400).json({ error: 'Missing course_id' });
  if (!enrollment_end_date) return res.status(400).json({ error: 'Enrollment deadline is mandatory' });

  try {
    const [existingRows] = await db.execute(`
      SELECT id, name, batch_status 
      FROM batches 
      WHERE course_id = ? AND batch_status IN ('upcoming', 'active')
      LIMIT 1
    `, [course_id]);
    
    if (existingRows.length > 0) {
      const existingBatch = existingRows[0];
      return res.status(400).json({
        error: `Cannot create a new batch. '${existingBatch.name}' is currently ${existingBatch.batch_status}. Please end it before starting a new one.`
      });
    }

    if (!duration_days) {
      const [courseRows] = await db.execute('SELECT duration_days FROM courses WHERE id = ?', [course_id]);
      if (courseRows.length > 0) duration_days = courseRows[0].duration_days;
    }

    const [countQuery] = await db.execute('SELECT COUNT(*) as count FROM batches WHERE course_id = ?', [course_id]);
    const nextBatchNum = (countQuery[0].count || 0) + 1;
    const batchName = `Batch ${nextBatchNum}`;

    const [result] = await db.execute(`
      INSERT INTO batches(name, course_id, instructor_id, duration_days, price, enrollment_status, batch_status, start_date, enrollment_end_date, is_finalized)
      VALUES(?, ?, ?, ?, ?, 'closed', 'upcoming', NULL, ?, 0)
    `, [batchName, course_id, instructor_id || null, duration_days || 30, price || 0, enrollment_end_date]);

    res.status(201).json({ id: result.insertId, message: 'Batch created successfully', name: batchName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

// PUT /api/batches/bulk-update - admin only
router.put('/bulk-update', authenticateToken, requireRole('admin'), async (req, res) => {
  const { ids, action } = req.body; 

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No batch IDs provided' });
  }

  try {
    const placeholders = ids.map(() => '?').join(',');
    const today = todayIST();

    let query = "";
    let params = [];
    let targetIds = ids;

    if (action === 'open_enrollment') {
      const targetIdsToOpen = [];
      for (const id of ids) {
        const [b] = await db.execute('SELECT is_finalized FROM batches WHERE id = ?', [id]);
        if (b[0] && !b[0].is_finalized) targetIdsToOpen.push(id);
      }
      
      if (targetIdsToOpen.length === 0) return res.status(400).json({ error: 'All selected batches are finalized and cannot be reopened.' });
      
      const subPlaceholders = targetIdsToOpen.map(() => '?').join(',');
      query = `UPDATE batches SET enrollment_status = 'open', batch_status = 'active' WHERE id IN (${subPlaceholders})`;
      params = targetIdsToOpen;
      targetIds = targetIdsToOpen;
    } else if (action === 'close_enrollment') {
      query = `UPDATE batches SET enrollment_status = 'closed' WHERE id IN (${placeholders})`;
      params = ids;
    } else if (action === 'end_batch') {
      query = `UPDATE batches SET batch_status = 'completed', enrollment_status = 'closed', end_date = ?, material_link = NULL, material_message = NULL, broadcast_message = NULL WHERE id IN (${placeholders})`;
      params = [today, ...ids];
    } else if (action === 'official_close') {
      query = `UPDATE batches SET batch_status = 'closed', enrollment_status = 'closed', end_date = ?, material_link = NULL, material_message = NULL, broadcast_message = NULL WHERE id IN (${placeholders})`;
      params = [today, ...ids];
    } else {
      return res.status(400).json({ error: 'Invalid bulk action' });
    }

    await db.execute(query, params);

    if (action === 'open_enrollment') {
      for (const id of targetIds) {
        const [b] = await db.execute('SELECT enrollment_status FROM batches WHERE id = ?', [id]);
        if (b[0] && b[0].enrollment_status === 'open') {
          await triggerWaitlistNotifications(id);
        }
      }
    }

    res.json({ message: `Bulk update (${action}) successful for ${targetIds.length} batches.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to perform bulk update' });
  }
});

// PUT /api/batches/:id - edit batch details
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, course_id, instructor_id, duration_days, price } = req.body;
  const batchId = req.params.id;

  if (!name || !course_id || !instructor_id || !duration_days || price == null) {
    return res.status(400).json({ error: 'All fields are mandatory' });
  }

  try {
    const [batchRows] = await db.execute('SELECT id FROM batches WHERE id = ?', [batchId]);
    if (batchRows.length === 0) return res.status(404).json({ error: 'Batch not found' });

    await db.execute(`
      UPDATE batches 
      SET name = ?, course_id = ?, instructor_id = ?, duration_days = ?, price = ?
      WHERE id = ?
    `, [name, course_id, instructor_id, duration_days, price, batchId]);

    res.json({ success: true, message: 'Batch updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

// PUT /api/batches/:id/enrollment - admin only toggle/update date
router.put('/:id/enrollment', authenticateToken, requireRole('admin'), async (req, res) => {
  const { status, enrollment_end_date } = req.body;
  const batchId = req.params.id;

  try {
    const [batchRows] = await db.execute('SELECT * FROM batches WHERE id = ?', [batchId]);
    const batch = batchRows[0];
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (batch.is_finalized && status === 'open') {
      return res.status(400).json({ error: 'Cannot reopen enrollment. This admission is finalized.' });
    }

    if (status && !['open', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid enrollment status' });
    }

    const updates = [];
    const params = [];
    const now = nowIST();

    if (enrollment_end_date !== undefined) {
      updates.push("enrollment_end_date = ?");
      params.push(enrollment_end_date);

      if (!batch.is_finalized && status === undefined) {
        const autoStatus = enrollment_end_date > now ? 'open' : 'closed';
        updates.push("enrollment_status = ?");
        params.push(autoStatus);
      }
    }

    if (status !== undefined) {
      updates.push("enrollment_status = ?");
      params.push(status);
      if (status === 'open') {
        updates.push("batch_status = 'active'");
      }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

    params.push(batchId);
    await db.execute(`UPDATE batches SET ${updates.join(', ')} WHERE id = ?`, params);

    const [currentBatchRows] = await db.execute('SELECT enrollment_status FROM batches WHERE id = ?', [batchId]);
    if (currentBatchRows[0] && currentBatchRows[0].enrollment_status === 'open') {
      await triggerWaitlistNotifications(batchId);
    }

    res.json({ message: 'Enrollment settings updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update enrollment settings' });
  }
});

// PUT /api/batches/:id/finalize - admin only finalize admission
router.put('/:id/finalize', authenticateToken, requireRole('admin'), async (req, res) => {
  const batchId = req.params.id;
  
  try {
    const [batchRows] = await db.execute(`
      SELECT b.name, b.instructor_id, c.name as course_name 
      FROM batches b 
      JOIN courses c ON b.course_id = c.id 
      WHERE b.id = ?
    `, [batchId]);
    const batch = batchRows[0];
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    await db.execute(`UPDATE batches SET is_finalized = 1, enrollment_status = 'closed', broadcast_message = NULL WHERE id = ?`, [batchId]);

    // Notify the Instructor that enrollment is finalized and they should start sessions
    if (batch.instructor_id) {
      const [instRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [batch.instructor_id]);
      if (instRows.length > 0) {
        const instructor = instRows[0];
        const { notifyInstructorOfUpdate } = require('../lib/emailService');
        notifyInstructorOfUpdate(
          instructor.email, 
          instructor.name, 
          batch.course_name, 
          batch.name, 
          'Enrollment Finalized', 
          'Admission for this batch is now permanently closed. You may now proceed to initiate the sessions and share live links with the students.'
        ).catch(err => {
          console.error("Failed to notify instructor of finalization:", err);
        });
      }
    }

    res.json({ message: 'Admission finalized. Enrollment closed permanently. Instructor has been notified to start sessions.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to finalize admission' });
  }
});

// PUT /api/batches/:id/end - admin only end batch (sets to completed)
router.put('/:id/end', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const batchId = req.params.id;
    const endDate = todayIST();
    const verificationDeadline = futureIST(48 * 60 * 60 * 1000);

    await db.execute(`
      UPDATE batches 
      SET batch_status = 'completed', 
          enrollment_status = 'closed', 
          end_date = ?, 
          verification_deadline = ?,
          material_link = NULL, 
          material_message = NULL,
          session_link = NULL,
          session_time = NULL,
          session_message = NULL
      WHERE id = ?
    `, [endDate, verificationDeadline, batchId]);

    const [students] = await db.execute(`
      SELECT u.email, u.name 
      FROM enrollments e 
      JOIN users u ON e.student_id = u.id 
      WHERE e.batch_id = ? AND e.status = 'approved'
    `, [batchId]);

    const [batchRows] = await db.execute('SELECT name FROM batches WHERE id = ?', [batchId]);
    const batch = batchRows[0];

    if (students.length > 0) {
      await notifyVerificationPending(students, batch.name);
    }

    res.json({ message: 'Batch completed. 48h verification period started. Notifications sent.' });
  } catch (err) {
    console.error("End batch error:", err);
    res.status(500).json({ error: 'Failed to end batch' });
  }
});

// POST /api/batches/:id/archive - admin only archive (auto-certs + hide from instructor)
router.post('/:id/archive', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const batchId = req.params.id;
    const archivedAt = nowIST();

    await db.execute(`
      UPDATE batches 
      SET archived_at = ?, batch_status = 'completed', broadcast_message = NULL
      WHERE id = ?
    `, [archivedAt, batchId]);

    const [batchRows] = await db.execute('SELECT name FROM batches WHERE id = ?', [batchId]);
    const batch = batchRows[0];

    const [students] = await db.execute(`
      SELECT student_id as id, u.email, u.name 
      FROM enrollments e 
      JOIN users u ON e.student_id = u.id 
      WHERE e.batch_id = ? AND e.status = 'approved'
    `, [batchId]);

    let certsIssued = 0;
    for (const student of students) {
      const result = await generateCertificateInternal(student.id, batchId);
      if (result && result.success) certsIssued++;
    }

    if (students.length > 0) {
      await notifyCertificateFinalized(students, batch.name);
    }

    res.json({ message: `Batch archived. ${certsIssued} certificates issued. All students notified.` });
  } catch (err) {
    console.error("Archive batch error:", err);
    res.status(500).json({ error: 'Failed to archive batch' });
  }
});

// PUT /api/batches/:id/close - admin only official close (hides for students)
router.put('/:id/close', authenticateToken, requireRole('admin'), async (req, res) => {
  const endDate = todayIST();
  try {
    await db.execute(`
      UPDATE batches SET batch_status = 'closed', enrollment_status = 'closed', end_date = ?, material_link = NULL, material_message = NULL WHERE id = ?
    `, [endDate, req.params.id]);
    res.json({ message: 'Batch officially closed, hidden from students, and materials cleared.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to close batch' });
  }
});

// PUT /api/batches/:id/start - admin only — moves batch to active, does NOT change enrollment_status
router.put('/:id/start', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [batchRows] = await db.execute('SELECT * FROM batches WHERE id = ?', [req.params.id]);
    const batch = batchRows[0];
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (batch.batch_status !== 'upcoming') {
      return res.status(400).json({ error: 'Only upcoming batches can be started.' });
    }

    await db.execute(`UPDATE batches SET batch_status = 'active' WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Batch started successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start batch' });
  }
});

// PUT /api/batches/:id/session-link - instructor/admin
router.put('/:id/session-link', authenticateToken, async (req, res) => {
  const { session_link, session_time } = req.body;
  const batchId = req.params.id;

  try {
    const [batchRows] = await db.execute(`
      SELECT b.*, u.email as instructor_email, u.name as instructor_name, c.name as course_name
      FROM batches b
      JOIN courses c ON b.course_id = c.id
      LEFT JOIN users u ON b.instructor_id = u.id
      WHERE b.id = ?
    `, [batchId]);
    const batch = batchRows[0];
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (req.user.role !== 'admin') {
      if (batch.instructor_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this batch' });
      }
      if (!batch.is_finalized && session_link && session_link.trim().length > 0) {
        return res.status(403).json({ error: 'Live session links can only be shared after the enrollment is finalized by the admin.' });
      }
    }

    await db.execute('UPDATE batches SET session_link = ?, session_time = ? WHERE id = ?', [session_link || null, session_time, batchId]);

    const [students] = await db.execute(`
      SELECT u.email FROM users u
      JOIN enrollments e ON u.id = e.student_id
      WHERE e.batch_id = ? AND e.status = 'approved'
    `, [batchId]);

    const { notifyStudentsOfInstructorNote, formatTimeAMPM } = require('../lib/emailService');

    if (students.length > 0) {
      if (session_link && session_link.trim().length > 0) {
        notifyStudentsOfSessionLink(students, batch.course_name, batch.name, session_link, `${todayIST()} ${session_time}`).catch(err => {
          console.error("Failed to send session link emails:", err);
        });
      } else {
        notifyStudentsOfInstructorNote(students, batch.name, `New update regarding session timing: ${formatTimeAMPM(session_time)}`).catch(console.error);
      }
    }

    const { notifyInstructorOfUpdate } = require('../lib/emailService');
    if (batch.instructor_email) {
      const formattedTime = formatTimeAMPM(session_time);
      notifyInstructorOfUpdate(
        batch.instructor_email,
        batch.instructor_name || 'Instructor',
        batch.course_name,
        batch.name,
        'Session Details Updated',
        `Time updated to: <strong>${formattedTime}</strong>${session_link ? `<br>Link: <a href="${session_link}">${session_link}</a>` : ''}`
      ).catch(err => console.error("Failed to notify instructor:", err));
    }

    res.json({ message: 'Session details updated and students notified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update session details' });
  }
});

// PUT /api/batches/:id/material - instructor/admin
router.put('/:id/material', authenticateToken, async (req, res) => {
  const { material_link, material_message } = req.body;
  const batchId = req.params.id;

  try {
    const [batchRows] = await db.execute('SELECT * FROM batches WHERE id = ?', [batchId]);
    const batch = batchRows[0];
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (['completed', 'closed'].includes(batch.batch_status) || batch.archived_at) {
        return res.status(403).json({ error: 'Cannot update materials for completed or closed batches.' });
    }

    if (req.user.role !== 'admin') {
      if (batch.instructor_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this batch' });
      }
      if (!batch.is_finalized && material_link && material_link.trim().length > 0) {
        return res.status(403).json({ error: 'Course material links can only be shared after the enrollment is finalized by the admin.' });
      }
    }

    await db.execute('UPDATE batches SET material_link = ?, material_message = ? WHERE id = ?', [material_link || null, material_message || null, batchId]);
    res.json({ message: 'Materials updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update materials' });
  }
});

// POST /api/batches/:id/broadcast - instructor/admin
router.put('/:id/broadcast', authenticateToken, async (req, res) => {
  // Assuming frontend changed POST to PUT or the other way around. Based on the previous version, it was POST. Let's fix route map.
  // Wait, I will export as POST to match previous schema.
});

// POST /api/batches/:id/broadcast - instructor/admin
router.post('/:id/broadcast', authenticateToken, async (req, res) => {
  const { message, mode } = req.body; 
  const batchId = req.params.id;

  if (!message || !message.trim()) return res.status(400).json({ error: 'Message content is required' });

  try {
    const [batchRows] = await db.execute(`
      SELECT b.*, c.name as course_name 
      FROM batches b
      JOIN courses c ON b.course_id = c.id
      WHERE b.id = ?
    `, [batchId]);
    const batch = batchRows[0];
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (['completed', 'closed'].includes(batch.batch_status) || batch.archived_at) {
      return res.status(403).json({ error: 'Cannot broadcast messages for completed or closed batches.' });
    }

    if (req.user.role !== 'admin' && batch.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (mode === 'portal' || mode === 'both') {
      await db.execute('UPDATE batches SET broadcast_message = ?, broadcast_updated_at = CURRENT_TIMESTAMP WHERE id = ?', [message, batchId]);
    }

    if (mode === 'email' || mode === 'both') {
      const [students] = await db.execute(`
        SELECT u.email FROM users u
        JOIN enrollments e ON u.id = e.student_id
        WHERE e.batch_id = ? AND e.status = 'approved'
      `, [batchId]);

      if (students.length > 0) {
        const { notifyStudentsOfInstructorNote } = require('../lib/emailService');
        notifyStudentsOfInstructorNote(students, batch.name, message).catch(err => {
          console.error("Broadcast email failure:", err);
        });
      }
    }

    res.json({ message: `Message broadcasted successfully via ${mode}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to broadcast message' });
  }
});

// DELETE /api/batches/:id/broadcast - instructor/admin
router.delete('/:id/broadcast', authenticateToken, async (req, res) => {
  const batchId = req.params.id;

  try {
    const [batchRows] = await db.execute('SELECT instructor_id FROM batches WHERE id = ?', [batchId]);
    const batch = batchRows[0];
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (req.user.role !== 'admin' && batch.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.execute('UPDATE batches SET broadcast_message = NULL WHERE id = ?', [batchId]);
    res.json({ message: 'Broadcast message cleared successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear broadcast' });
  }
});

// POST /api/batches/:id/read-guideline - student only
router.post('/:id/read-guideline', authenticateToken, requireRole('student'), async (req, res) => {
  const batchId = req.params.id;
  const studentId = req.user.id;

  try {
    const [result] = await db.execute(`
      UPDATE enrollments 
      SET last_read_guideline_at = CURRENT_TIMESTAMP 
      WHERE student_id = ? AND batch_id = ?
    `, [studentId, batchId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json({ message: 'Guideline marked as read' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log guideline read' });
  }
});

// GET /api/batches/waitlisted - student gets all waitlisted batch IDs
router.get('/waitlisted', authenticateToken, requireRole('student'), async (req, res) => {
  const studentId = req.user.id;
  try {
    const [rows] = await db.execute('SELECT batch_id FROM waitlist WHERE student_id = ?', [studentId]);
    res.json(rows.map(r => r.batch_id));
  } catch(err) {
    res.status(500).json({ error: 'Error' });
  }
});

// POST /api/batches/:id/notify - student joins waitlist for notification
router.post('/:id/notify', authenticateToken, requireRole('student'), async (req, res) => {
  const batchId = req.params.id;
  const studentId = req.user.id;
  try {
    await db.execute('INSERT INTO waitlist (student_id, batch_id) VALUES (?, ?)', [studentId, batchId]);
    res.json({ message: 'Added to notification list' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'You are already on the notification list' });
    }
    return res.status(500).json({ error: 'Failed to add to notification list' });
  }
});

// GET /api/batches/:id/notify - student checks if they are on waitlist
router.get('/:id/notify', authenticateToken, requireRole('student'), async (req, res) => {
  const batchId = req.params.id;
  const studentId = req.user.id;
  try {
    const [rows] = await db.execute('SELECT id FROM waitlist WHERE student_id = ? AND batch_id = ?', [studentId, batchId]);
    res.json({ notified: rows.length > 0 });
  } catch(err) {
    res.status(500).json({ error: 'Error' });
  }
});

// GET /api/batches/:id/workspace - student workspace view
router.get('/:id/workspace', authenticateToken, requireRole('student'), async (req, res) => {
  const batchId = req.params.id;
  const studentId = req.user.id;

  try {
    const [enrollmentRows] = await db.execute('SELECT status, last_read_guideline_at FROM enrollments WHERE student_id = ? AND batch_id = ?', [studentId, batchId]);
    const enrollment = enrollmentRows[0];
    if (!enrollment || enrollment.status !== 'approved') {
      return res.status(403).json({ error: 'You are not enrolled or approved for this batch.' });
    }

    const [batchRows] = await db.execute(`
      SELECT b.*, c.name as course_name, c.category, u.name as instructor_name, e.last_read_guideline_at
      FROM batches b
      JOIN courses c ON b.course_id = c.id
      LEFT JOIN users u ON b.instructor_id = u.id
      JOIN enrollments e ON b.id = e.batch_id
      WHERE b.id = ? AND e.student_id = ?
    `, [batchId, studentId]);

    if (batchRows.length === 0) return res.status(404).json({ error: 'Batch workspace not found or unauthorized' });

    const batch = batchRows[0];

    // Fetch Materials Stack
    const [materials] = await db.execute('SELECT * FROM batch_materials WHERE batch_id = ? ORDER BY created_at DESC', [batchId]);
    batch.materials = materials;

    // Always return session details so the frontend can manage the 10-minute join window
    const visibleSessionLink = batch.session_link && batch.is_finalized ? batch.session_link : null;

    const totalClasses = batch.duration_days;
    const [attRows] = await db.execute(`SELECT COUNT(*) as count FROM attendance WHERE batch_id = ? AND student_id = ? AND status = 'present'`, [batchId, studentId]);
    const attendedClasses = attRows[0].count;
    const percentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(2) : 0;

    res.json({
      ...batch,
      last_read_guideline_at: enrollment.last_read_guideline_at,
      session_link: visibleSessionLink, 
      attendance: {
        totalClasses,
        attendedClasses,
        percentage: parseFloat(percentage),
        eligibleForCertificate: parseFloat(percentage) >= 75
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
});

// DELETE /api/batches/:id - admin only
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const batchId = parseInt(req.params.id);
  if (isNaN(batchId)) return res.status(400).json({ error: 'Invalid batch ID' });

  try {
    const [batchRows] = await db.execute('SELECT id FROM batches WHERE id = ?', [batchId]);
    if (batchRows.length === 0) return res.status(404).json({ error: 'Batch not found' });

    await db.execute('DELETE FROM attendance WHERE batch_id = ?', [batchId]);
    await db.execute('DELETE FROM enrollments WHERE batch_id = ?', [batchId]);
    await db.execute('DELETE FROM waitlist WHERE batch_id = ?', [batchId]);
    await db.execute('DELETE FROM batches WHERE id = ?', [batchId]);

    console.log(`[ADMIN] Batch ${batchId} deleted along with associated records.`);
    res.json({ success: true, message: 'Batch deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

// GET /api/batches/:id/materials - Fetch materials stack
router.get('/:id/materials', authenticateToken, async (req, res) => {
  const batchId = req.params.id;
  try {
    const [rows] = await db.execute('SELECT * FROM batch_materials WHERE batch_id = ? ORDER BY created_at DESC', [batchId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// POST /api/batches/:id/materials - Add to materials stack
router.post('/:id/materials', authenticateToken, async (req, res) => {
  const batchId = req.params.id;
  const { message, link } = req.body;

  try {
    const [batchRows] = await db.execute('SELECT instructor_id FROM batches WHERE id = ?', [batchId]);
    const batch = batchRows[0];
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (req.user.role !== 'admin' && batch.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.execute('INSERT INTO batch_materials (batch_id, message, link) VALUES (?, ?, ?)', [batchId, message, link]);
    res.json({ message: 'Material published successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to publish material' });
  }
});

// DELETE /api/batches/materials/:id - Delete specific material
router.delete('/materials/:id', authenticateToken, async (req, res) => {
    const materialId = req.params.id;
    try {
        const [rows] = await db.execute('SELECT batch_id FROM batch_materials WHERE id = ?', [materialId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Material not found' });
        
        const batchId = rows[0].batch_id;
        const [batchRows] = await db.execute('SELECT instructor_id FROM batches WHERE id = ?', [batchId]);
        const batch = batchRows[0];
        
        if (req.user.role !== 'admin' && batch.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await db.execute('DELETE FROM batch_materials WHERE id = ?', [materialId]);
        res.json({ message: 'Material deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete material' });
    }
});

// DELETE /api/batches/:id/material - instructor/admin (DEPRECATED, but kept for legacy compat if needed)
router.delete('/:id/material', authenticateToken, async (req, res) => {
  const batchId = req.params.id;

  try {
    const [batchRows] = await db.execute('SELECT instructor_id FROM batches WHERE id = ?', [batchId]);
    const batch = batchRows[0];
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (req.user.role !== 'admin' && batch.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.execute('UPDATE batches SET material_link = NULL, material_message = NULL WHERE id = ?', [batchId]);
    res.json({ message: 'Legacy course materials cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete materials' });
  }
});

// PUT /api/batches/:id/finalize-course - instructor/admin
router.put('/:id/finalize-course', authenticateToken, async (req, res) => {
  const batchId = req.params.id;

  try {
    const [batchRows] = await db.execute(`
      SELECT b.*, c.name as course_name 
      FROM batches b
      JOIN courses c ON b.course_id = c.id
      WHERE b.id = ?
    `, [batchId]);
    const batch = batchRows[0];
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (req.user.role !== 'admin' && batch.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const today = todayIST();
    const verificationDeadline = futureIST(48 * 60 * 60 * 1000);
            
    await db.execute(`
       UPDATE batches 
       SET batch_status = 'completed', 
           attendance_completed = 1,
           instructor_verified = 1,
           enrollment_status = 'closed', 
           end_date = ?, 
           verification_deadline = ?,
           material_link = NULL, 
           material_message = NULL,
           broadcast_message = NULL,
           session_link = NULL,
           session_time = NULL,
           session_message = NULL
       WHERE id = ?
    `, [today, verificationDeadline, batchId]);

    const [students] = await db.execute(`
       SELECT u.email, u.name 
       FROM enrollments e 
       JOIN users u ON e.student_id = u.id 
       WHERE e.batch_id = ? AND e.status = 'approved'
    `, [batchId]);

    const { notifyVerificationPending, notifyAdminOfVerification } = require('../lib/emailService');

    // Notify Students
    if (students.length > 0) {
      await notifyVerificationPending(students, batch.name);
    }

    // Notify Admin
    await notifyAdminOfVerification(batch.name, req.user.name, batch.course_name);
    
    res.json({ message: 'Course successfully verified by instructor! 2-day admin verification window started.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to finalize course' });
  }
});

module.exports = router;
