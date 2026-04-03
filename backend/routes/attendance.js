const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/attendance/batch/:batch_id/date/:date - instructor/admin
router.get('/batch/:batch_id/date/:date', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
    const { batch_id, date } = req.params;

    try {
        if (req.user.role === 'instructor') {
            const [batchRows] = await db.execute('SELECT instructor_id FROM batches WHERE id = ?', [batch_id]);
            const batch = batchRows[0];
            if (!batch || batch.instructor_id !== req.user.id) {
                return res.status(403).json({ error: "Forbidden: Not assigned." });
            }
        }

        // Get all approved students in this batch
        const [students] = await db.execute(`
        SELECT s.id, s.name, s.email, e.enrolled_at,
          (SELECT status FROM attendance WHERE student_id = s.id AND batch_id = ? AND date = ?) as attendance_status
        FROM enrollments e
        JOIN users s ON e.student_id = s.id
        WHERE e.batch_id = ? AND e.status = 'approved'
      `, [batch_id, date, batch_id]);

        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch attendance data' });
    }
});

// POST /api/attendance/batch/:batch_id - instructor (Mark absent students)
router.post('/batch/:batch_id', authenticateToken, requireRole('instructor'), async (req, res) => {
    const { batch_id } = req.params;
    const { date, records } = req.body; // records: { student_id: 'present'|'absent' }
    const instructor_id = req.user.id;

    let connection;
    try {
        const [batchRows] = await db.execute(`SELECT instructor_id, batch_status, is_finalized FROM batches WHERE id = ?`, [batch_id]);
        const batch = batchRows[0];
        if (!batch) return res.status(404).json({ error: 'Batch not found' });
        if (batch.batch_status !== 'active') return res.status(400).json({ error: 'Attendance can only be marked for active batches.' });
        if (batch.instructor_id !== instructor_id) return res.status(403).json({ error: 'Unauthorized' });
        if (!batch.is_finalized) return res.status(403).json({ error: 'Batch not finalized yet.' });

        const [existingDateRows] = await db.execute(`SELECT 1 FROM attendance WHERE batch_id = ? AND date = ? LIMIT 1`, [batch_id, date]);
        
        if (existingDateRows.length === 0) {
            const todayIST = new Date(Date.now() + 5.5 * 3600000).toISOString().split('T')[0];
            const [statsRows] = await db.execute(`SELECT COUNT(DISTINCT date) as c FROM attendance WHERE batch_id = ? AND date <= ?`, [batch_id, todayIST]);
            const [bInfoRows] = await db.execute(`SELECT duration_days FROM batches WHERE id = ?`, [batch_id]);
            
            if (statsRows[0] && bInfoRows[0] && statsRows[0].c >= bInfoRows[0].duration_days) {
                return res.status(400).json({ error: 'Cannot add more attendance days than the batch duration.' });
            }
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        for (const [student_id, status] of Object.entries(records)) {
            await connection.execute(`
                INSERT INTO attendance (student_id, batch_id, date, status, marked_by)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)
            `, [student_id, batch_id, date, status, instructor_id]);
        }

        await connection.commit();

        res.json({ message: 'Attendance records updated successfully' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to update attendance' });
    } finally {
        if (connection) connection.release();
    }
});


// GET /api/attendance/student/:student_id/batch/:batch_id/stats - student/instructor/admin
router.get('/student/:student_id/batch/:batch_id/stats', authenticateToken, async (req, res) => {
    const { student_id, batch_id } = req.params;

    if (req.user.role === 'student' && parseInt(student_id) !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const [batchRows] = await db.execute(`SELECT duration_days FROM batches WHERE id = ?`, [batch_id]);
        const totalClasses = batchRows[0]?.duration_days || 0;
        
        const todayIST3 = new Date(Date.now() + 5.5 * 3600000).toISOString().split('T')[0];
        
        const [attRows] = await db.execute(`SELECT COUNT(*) as count FROM attendance WHERE batch_id = ? AND student_id = ? AND status = 'present' AND date <= ?`, [batch_id, student_id, todayIST3]);
        const attendedClasses = attRows[0]?.count || 0;

        const percentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(2) : 0;

        res.json({
            totalClasses,
            attendedClasses,
            percentage: parseFloat(percentage),
            eligibleForCertificate: parseFloat(percentage) >= 75
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch attendance stats' });
    }
});

// GET /api/attendance/batch/:batch_id/all - admin/instructor
router.get('/batch/:batch_id/all', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
    const { batch_id } = req.params;

    try {
        if (req.user.role === 'instructor') {
            const [batchRows] = await db.execute('SELECT instructor_id FROM batches WHERE id = ?', [batch_id]);
            const batch = batchRows[0];
            if (!batch || batch.instructor_id !== req.user.id) {
                return res.status(403).json({ error: "Forbidden: You are not assigned to this batch." });
            }
        }

        const [datesInfo] = await db.execute(`SELECT DISTINCT DATE_FORMAT(date, '%Y-%m-%d') as date FROM attendance WHERE batch_id = ? ORDER BY date ASC`, [batch_id]);
        const dates = datesInfo.map(d => d.date);

        const [students] = await db.execute(`
            SELECT s.id, s.name, s.email, e.enrolled_at
            FROM enrollments e
            JOIN users s ON e.student_id = s.id
            WHERE e.batch_id = ? AND e.status = 'approved'
        `, [batch_id]);

        const [recordsInfo] = await db.execute(`
            SELECT student_id, DATE_FORMAT(date, '%Y-%m-%d') as date, status
            FROM attendance
            WHERE batch_id = ?
        `, [batch_id]);

        const attendanceRecords = {};
        recordsInfo.forEach(record => {
            if (!attendanceRecords[record.student_id]) {
                attendanceRecords[record.student_id] = {};
            }
            attendanceRecords[record.student_id][record.date] = record.status;
        });

        res.json({ dates, students, records: attendanceRecords });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
});

module.exports = router;
