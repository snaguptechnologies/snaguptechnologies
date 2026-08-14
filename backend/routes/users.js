const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/users/students - admin only
router.get('/students', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const [students] = await db.execute(`
            SELECT 
                u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
                COUNT(e.id) as enrollment_count,
                CASE 
                    WHEN COUNT(e.id) > 0 THEN 
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'enrollment_id', e.id,
                                'batch_id', b.id,
                                'batch_name', b.name,
                                'course_id', c.id,
                                'course_name', c.name,
                                'status', e.status,
                                'duration_days', COALESCE(b.duration_days, 30),
                                'attended_sessions', (SELECT COUNT(*) FROM attendance WHERE student_id = u.id AND batch_id = b.id AND status = 'present'),
                                'cert_id', (SELECT cert_id FROM certificates WHERE student_id = u.id AND batch_id = b.id LIMIT 1),
                                'release_type', (SELECT release_type FROM certificates WHERE student_id = u.id AND batch_id = b.id LIMIT 1),
                                'cert_status', (SELECT status FROM certificates WHERE student_id = u.id AND batch_id = b.id LIMIT 1)
                            )
                        )
                    ELSE JSON_ARRAY()
                END as enrollments
            FROM users u
            LEFT JOIN enrollments e ON u.id = e.student_id AND e.status = 'approved'
            LEFT JOIN batches b ON e.batch_id = b.id
            LEFT JOIN courses c ON b.course_id = c.id
            WHERE u.role = 'student'
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);

        res.json(students);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// DELETE /api/users/:id - admin only
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    const userId = req.params.id;
    const adminId = req.user.id;

    if (parseInt(userId) === parseInt(adminId)) {
        return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Delete certificates
        await connection.execute(`DELETE FROM certificates WHERE student_id = ?`, [userId]);
        // 2. Delete attendance
        await connection.execute(`DELETE FROM attendance WHERE student_id = ?`, [userId]);
        // 3. Delete payments (via enrollments)
        await connection.execute(`DELETE FROM payments WHERE student_id = ?`, [userId]);
        // 4. Delete enrollments
        await connection.execute(`DELETE FROM enrollments WHERE student_id = ?`, [userId]);

        // If instructor, handle batches
        const [rows] = await connection.execute(`SELECT role FROM users WHERE id = ?`, [userId]);
        const user = rows[0];
        if (user && user.role === 'instructor') {
            await connection.execute(`UPDATE batches SET instructor_id = NULL WHERE instructor_id = ?`, [userId]);
        }

        // Finally delete the user
        await connection.execute(`DELETE FROM users WHERE id = ?`, [userId]);

        await connection.commit();
        res.json({ message: 'User and related records deleted successfully.' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Delete Error:", err);
        res.status(500).json({ error: 'Failed to delete user.' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
