const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/users/students - admin only
router.get('/students', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const [students] = await db.execute(`
            SELECT id, name, email, phone, is_active, created_at
            FROM users
            WHERE role = 'student'
            ORDER BY created_at DESC
        `);

        // Attach enrollment counts
        for (let s of students) {
            const [stats] = await db.execute(`SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?`, [s.id]);
            s.enrollment_count = stats[0].count;
        }

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
