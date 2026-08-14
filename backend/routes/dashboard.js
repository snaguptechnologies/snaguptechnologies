const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/dashboard/admin
router.get('/admin', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [coursesRows] = await db.execute(`SELECT COUNT(*) as c FROM courses`);
    const totalCourses = coursesRows[0].c;

    const [instRows] = await db.execute(`SELECT COUNT(*) as c FROM users WHERE role='instructor' AND is_active=1`);
    const totalInstructors = instRows[0].c;

    const [studRows] = await db.execute(`SELECT COUNT(*) as c FROM users WHERE role='student' AND is_active=1`);
    const totalStudents = studRows[0].c;

    const [actBatchRows] = await db.execute(`SELECT COUNT(*) as c FROM batches WHERE batch_status='active'`);
    const activeBatches = actBatchRows[0].c;

    const [compBatchRows] = await db.execute(`SELECT COUNT(*) as c FROM batches WHERE batch_status='completed'`);
    const completedBatches = compBatchRows[0].c;

    const [certsRows] = await db.execute(`SELECT COUNT(*) as c FROM certificates`);
    const certsIssued = certsRows[0].c;

    const [pendEnrollRows] = await db.execute(`SELECT COUNT(*) as c FROM enrollments WHERE status='pending'`);
    const pendingEnrollments = pendEnrollRows[0].c;

    const [recentBatches] = await db.execute(`
      SELECT b.*, c.name as course_name, u.name as instructor_name
      FROM batches b
      LEFT JOIN courses c ON b.course_id = c.id
      LEFT JOIN users u ON b.instructor_id = u.id
      ORDER BY b.created_at DESC LIMIT 5
    `);

    const [userRows] = await db.execute(`SELECT id, name, email, role, phone FROM users WHERE id = ?`, [req.user.id]);
    const user = userRows[0];
    
    // Financial Analytics - Using LEFT JOIN to ensure all payments are captured
    const [allPayments] = await db.execute(`
        SELECT p.amount, p.status, 
               DATE_FORMAT(p.created_at, '%Y-%m-%dT%H:%i:%sZ') as created_at, 
               b.course_id, b.id as batch_id 
        FROM payments p
        LEFT JOIN enrollments e ON p.enrollment_id = e.id
        LEFT JOIN batches b ON e.batch_id = b.id
    `);
    
    const totalRevenue = allPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingRevenue = allPayments.filter(p => p.status === 'pending' || p.status === 'partial').reduce((sum, p) => sum + Number(p.amount), 0);
    
    const [recentPayments] = await db.execute(`
       SELECT p.amount, p.status, p.created_at, p.transaction_id, u.name as student_name, u.phone as student_phone, c.name as course_name, b.course_id, b.id as batch_id
       FROM payments p
       JOIN users u ON p.student_id = u.id
       JOIN enrollments e ON p.enrollment_id = e.id
       JOIN batches b ON e.batch_id = b.id
       JOIN courses c ON b.course_id = c.id
       ORDER BY p.created_at DESC
       LIMIT 5
    `);
    
    let paymentSuccessRate = 0;
    if (allPayments.length > 0) {
       paymentSuccessRate = Math.round((allPayments.filter(p => p.status === 'completed').length / allPayments.length) * 100);
    }
    
    const [activeBatchProgress] = await db.execute(`
      SELECT b.id, b.name, b.duration_days, b.batch_status, b.course_id,
        (SELECT COUNT(DISTINCT date) FROM attendance WHERE batch_id = b.id) as sessions_completed,
        c.name as course_name
      FROM batches b
      JOIN courses c ON b.course_id = c.id
      WHERE b.batch_status IN ('active', 'upcoming')
    `);
    
    // Aggregate Trends for the last 12 months
    let revenueTrendTrend = [];
    
    // 1. Determine a safe START date for the 12-month period
    let start = new Date();
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    // If we have payments, we can optionally start from the earliest record if it's older than 12m
    if (allPayments.length > 0) {
        const validDates = allPayments
            .map(p => new Date(p.created_at))
            .filter(d => !isNaN(d.getTime()));
            
        if (validDates.length > 0) {
            // Safer way to find min without spread operator to avoid stack overflow
            const minTime = validDates.reduce((min, d) => Math.min(min, d.getTime()), validDates[0].getTime());
            const minRecordDate = new Date(minTime);
            minRecordDate.setDate(1);
            minRecordDate.setHours(0, 0, 0, 0);
            // Use the earlier of (12m ago) or (First payment)
            if (minRecordDate < start) {
                start = minRecordDate;
            }
        }
    }

    // 2. Generate Buckets and Aggregate
    const current = new Date(start);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1); // Buffer for current month

    while (current <= maxDate) {
        const monthKey = current.toISOString().slice(0, 7);
        const value = allPayments
            .filter(p => {
                if (p.status !== 'completed' || !p.created_at) return false;
                const d = new Date(p.created_at);
                if (isNaN(d.getTime())) return false;
                return d.toISOString().slice(0, 7) === monthKey;
            })
            .reduce((sum, p) => sum + Number(p.amount), 0);
        
        revenueTrendTrend.push({
            name: current.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
            key: monthKey,
            value: Number(value.toFixed(2))
        });
        
        current.setMonth(current.getMonth() + 1);
        // Safety break to prevent infinite loops if current doesn't advance
        if (revenueTrendTrend.length > 60) break; 
    }

    res.json({ 
        totalCourses, totalInstructors, totalStudents, activeBatches, completedBatches, certsIssued, pendingEnrollments, recentBatches, user,
        activeBatchProgress,
        financials: { totalRevenue, pendingRevenue, paymentSuccessRate, recentPayments, allPayments, revenueTrend: revenueTrendTrend }
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    // Log to a file we can read
    require('fs').appendFileSync('dashboard_error.log', `[${new Date().toISOString()}] Admin dashboard error: ${err.stack}\n`);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /api/dashboard/admin/emails
router.get('/admin/emails', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [logs] = await db.execute(`
      SELECT id, recipient_email, subject, purpose, status, 
             DATE_FORMAT(sent_at, '%Y-%m-%dT%H:%i:%sZ') as sent_at 
      FROM email_logs
      ORDER BY sent_at DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

// GET /api/dashboard/instructor
router.get('/instructor', authenticateToken, requireRole('instructor'), async (req, res) => {
  try {
    const id = req.user.id;
    const [myBatches] = await db.execute(`
      SELECT b.*, c.name as course_name,
        (SELECT COUNT(*) FROM enrollments WHERE batch_id=b.id AND status='approved') as enrolled_count,
        (SELECT COUNT(DISTINCT date) FROM attendance WHERE batch_id=b.id) as sessions_completed
      FROM batches b
      LEFT JOIN courses c ON b.course_id = c.id
      WHERE b.instructor_id = ?
      ORDER BY b.created_at DESC
    `, [id]);

    const activeBatchesCount = myBatches.filter(b => b.batch_status === 'active').length;
    const totalStudentsEnroll = myBatches.reduce((s, b) => s + (b.enrolled_count || 0), 0);

    const [userRows] = await db.execute(`SELECT id, name, email, role, phone FROM users WHERE id = ?`, [id]);
    const user = userRows[0];
    
    // Fetch dynamic session reminders
    const [remindersRows] = await db.execute(`SELECT \`value\` FROM settings WHERE \`key\`='session_reminders'`);
    let remindersArray = [60, 30];
    if (remindersRows.length > 0 && remindersRows[0].value) {
        try { remindersArray = JSON.parse(remindersRows[0].value); } catch(e){}
    }

    res.json({ myBatches, activeBatches: activeBatchesCount, totalStudents: totalStudentsEnroll, totalBatches: myBatches.length, user, reminders: remindersArray });
  } catch (err) {
    console.error("Instructor dashboard error:", err);
    res.status(500).json({ error: 'Failed to fetch instructor stats' });
  }
});

// GET /api/dashboard/student
router.get('/student', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const id = req.user.id;
    
    // Calculate current IST Date string for SQL filtering
    const nowISTDate = new Date(Date.now() + 5.5 * 3600000).toISOString().split('T')[0];

    const [enrollments] = await db.execute(`
      SELECT e.*, b.name as batch_name, b.duration_days, b.price, b.batch_status, b.session_link, b.session_time, b.material_link, b.material_message, b.broadcast_message, b.broadcast_updated_at, b.archived_at, b.verification_deadline, b.attendance_completed, b.instructor_verified,
        c.name as course_name, c.category,
        u.name as instructor_name,
        (SELECT SUM(amount) FROM payments WHERE enrollment_id = e.id AND status = 'completed') as paid_amount,
        (SELECT COUNT(DISTINCT date) FROM attendance WHERE batch_id = b.id AND student_id = e.student_id AND status = 'present' AND date <= ?) as attended_sessions,
        (SELECT COUNT(DISTINCT date) FROM attendance WHERE batch_id = b.id AND date <= ?) as conducted_sessions,
        (SELECT cert_id FROM certificates WHERE student_id = e.student_id AND batch_id = e.batch_id LIMIT 1) as cert_id,
        (SELECT release_type FROM certificates WHERE student_id = e.student_id AND batch_id = e.batch_id LIMIT 1) as release_type,
        (SELECT status FROM certificates WHERE student_id = e.student_id AND batch_id = e.batch_id LIMIT 1) as cert_status
      FROM enrollments e
      JOIN batches b ON e.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      LEFT JOIN users u ON b.instructor_id = u.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `, [nowISTDate, nowISTDate, id]);

    const [certs] = await db.execute(`
      SELECT c.*, co.name as course_name, b.name as batch_name
      FROM certificates c
      JOIN batches b ON c.batch_id = b.id
      JOIN courses co ON b.course_id = co.id
      WHERE c.student_id = ?
      ORDER BY c.issued_at DESC
    `, [id]);

    const [userRows] = await db.execute(`SELECT id, name, email, role, phone FROM users WHERE id = ?`, [id]);
    const user = userRows[0];
    
    const totalEnrollments = enrollments.filter(e => e.batch_status !== 'completed').length;
    res.json({ enrollments, certificates: certs, totalEnrollments, totalCertificates: certs.length, activeCourses: enrollments.filter(e => e.batch_status === 'active').length, user });
  } catch (err) {
    console.error("Student dashboard error:", err);
    res.status(500).json({ error: 'Failed to fetch student stats' });
  }
});

module.exports = router;
