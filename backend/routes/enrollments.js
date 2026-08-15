const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const crypto = require('crypto');
const { notifyEnrollmentSuccess, notifyEnrollmentRejected, notifyEnrollmentReceived } = require('../lib/emailService');

// POST /api/enrollments - student only
router.post('/', authenticateToken, requireRole('student'), async (req, res) => {
    const { batch_id, payment_method, transaction_id } = req.body;
    const student_id = req.user.id;

    if (!batch_id) return res.status(400).json({ error: 'Batch ID required' });

    let connection;
    try {
        const [batchRows] = await db.execute(`SELECT * FROM batches WHERE id = ?`, [batch_id]);
        const batch = batchRows[0];
        if (!batch) return res.status(404).json({ error: 'Batch not found' });

        // SnagUp Skill Platform - Courses remain available continuously for registration without batch deadlines or status blocks.


        connection = await db.getConnection();
        await connection.beginTransaction();

        const txId = (transaction_id && transaction_id.trim().length >= 4)
            ? transaction_id.trim()
            : `APP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const [existingEnrollments] = await connection.execute("SELECT status FROM enrollments WHERE student_id = ? AND batch_id = ?", [student_id, batch_id]);
        if (existingEnrollments.length > 0) {
            const existingEnrollment = existingEnrollments[0];
            if (existingEnrollment.status === 'approved') throw new Error('You are already enrolled in this course.');
            if (existingEnrollment.status === 'pending') throw new Error('Your enrollment request is already pending review.');
            if (existingEnrollment.status === 'rejected') throw new Error('You have a rejected enrollment for this course. Please clear it from your dashboard first.');
            throw new Error('An enrollment already exists for this batch.');
        }

        const [existingTxs] = await connection.execute('SELECT id FROM payments WHERE transaction_id = ?', [txId]);
        if (existingTxs.length > 0) throw new Error('This Application ID has already been registered.');

        const [enrollmentResult] = await connection.execute(
            `INSERT INTO enrollments (student_id, batch_id, status) VALUES (?, ?, 'pending')`, 
            [student_id, batch_id]
        );
        const enrollmentId = enrollmentResult.insertId;

        await connection.execute(`
            INSERT INTO payments (enrollment_id, student_id, amount, payment_method, transaction_id, status)
            VALUES (?, ?, 0, 'direct', ?, 'completed')
        `, [enrollmentId, student_id, txId]);

        await connection.commit();
        
        notifyEnrollmentReceived(
            { name: req.user.name, email: req.user.email },
            batch.name,
            transaction_id
        ).catch(console.error);

        res.status(201).json({ id: enrollmentId, message: 'Payment submitted for verification. You will be notified once approved.' });
    } catch (err) {
        if (connection) await connection.rollback();
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Already enrolled (or payment pending) for this batch' });
        if (err.message === 'This Transaction ID has already been used.' || err.message.includes('UTR') || err.message.includes('enrolled')) {
            return res.status(400).json({ error: err.message });
        }
        console.error('Enrollment Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (connection) connection.release();
    }
});

// POST /api/enrollments/admin - admin only (direct student enrollment)
router.post('/admin', authenticateToken, requireRole('admin'), async (req, res) => {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) {
        return res.status(400).json({ error: 'Student ID and Course ID are required.' });
    }

    let connection;
    try {
        // Find default cohort for this course
        const [batches] = await db.execute(`SELECT id FROM batches WHERE course_id = ? ORDER BY id ASC LIMIT 1`, [course_id]);
        let batchId;
        if (batches.length === 0) {
            const [courseRows] = await db.execute(`SELECT name FROM courses WHERE id = ?`, [course_id]);
            const courseName = courseRows[0]?.name || 'Course';
            const [newBatch] = await db.execute(`
                INSERT INTO batches (course_id, name, batch_status, enrollment_status, duration_days, price)
                VALUES (?, ?, 'active', 'open', 0, 0)
            `, [course_id, `${courseName} - Default Cohort`]);
            batchId = newBatch.insertId;
        } else {
            batchId = batches[0].id;
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check if student is already enrolled in this course
        const [existingEnrollments] = await connection.execute(
            `SELECT e.id, e.status FROM enrollments e JOIN batches b ON e.batch_id = b.id WHERE e.student_id = ? AND b.course_id = ?`,
            [student_id, course_id]
        );

        if (existingEnrollments.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Student is already enrolled in this course.' });
        }

        const txId = `ADMIN-ENR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const [enrollmentResult] = await connection.execute(
            `INSERT INTO enrollments (student_id, batch_id, status) VALUES (?, ?, 'approved')`,
            [student_id, batchId]
        );
        const enrollmentId = enrollmentResult.insertId;

        await connection.execute(`
            INSERT INTO payments (enrollment_id, student_id, amount, payment_method, transaction_id, status)
            VALUES (?, ?, 0, 'admin_direct', ?, 'completed')
        `, [enrollmentId, student_id, txId]);

        await connection.commit();

        // Return the newly created enrollment details
        const [newEnrollmentRows] = await db.execute(`
            SELECT e.id as enrollment_id, e.batch_id, b.name as batch_name, c.id as course_id, c.name as course_name, e.status,
            DATE_FORMAT(e.enrolled_at, '%Y-%m-%dT%H:%i:%sZ') as enrolled_at
            FROM enrollments e
            JOIN batches b ON e.batch_id = b.id
            JOIN courses c ON b.course_id = c.id
            WHERE e.id = ?
        `, [enrollmentId]);

        res.status(201).json({
            message: 'Student enrolled successfully.',
            enrollment: newEnrollmentRows[0]
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Admin Enrollment Error:', err);
        res.status(500).json({ error: 'Failed to enroll student.' });
    } finally {
        if (connection) connection.release();
    }
});

// GET /api/enrollments - admin/student
router.get('/', authenticateToken, async (req, res) => {
    const { status } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
    SELECT e.*, 
      s.name as student_name, s.email as student_email, s.phone as student_phone,
      b.name as batch_name, b.price as batch_price, b.course_id as course_id, e.batch_id as batch_id, c.name as course_name,
      DATE_FORMAT(e.enrolled_at, '%Y-%m-%dT%H:%i:%sZ') as enrolled_at,
      DATE_FORMAT(e.updated_at, '%Y-%m-%dT%H:%i:%sZ') as updated_at,
      (SELECT transaction_id FROM payments WHERE enrollment_id = e.id ORDER BY created_at DESC LIMIT 1) as transaction_id,
      (SELECT status FROM payments WHERE enrollment_id = e.id ORDER BY created_at DESC LIMIT 1) as payment_status,
      (SELECT amount FROM payments WHERE enrollment_id = e.id ORDER BY created_at DESC LIMIT 1) as paid_amount,
      (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'transaction_id', transaction_id, 'amount', amount, 'status', status, 'created_at', DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ'))) FROM payments WHERE enrollment_id = e.id) as payment_history,
      e.is_utr_updated
    FROM enrollments e
    JOIN users s ON e.student_id = s.id
    JOIN batches b ON e.batch_id = b.id
    JOIN courses c ON b.course_id = c.id
  `;

    let params = [];
    if (userRole === 'admin') {
        if (status) {
            query += ` WHERE e.status = ? `;
            params.push(status);
        }
    } else {
        query += ` WHERE e.student_id = ? `;
        params.push(userId);
        if (status) {
            query += ` AND e.status = ? `;
            params.push(status);
        }
    }

    query += ` ORDER BY e.enrolled_at DESC`;
    
    try {
        const [enrollments] = await db.execute(query, params);
        
        // MySQL JSON_ARRAYAGG returns an array object, whereas SQLite json_group_array returns a string.
        // Let's ensure uniform structure.
        const serializedEnrollments = enrollments.map(e => {
            if (typeof e.payment_history === 'string') {
                try { e.payment_history = JSON.parse(e.payment_history); } catch(err) { e.payment_history = []; }
            }
            return e;
        });

        res.json(serializedEnrollments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
});

// PUT /api/enrollments/:id/status - admin only
router.put('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
    const enrollmentId = req.params.id;
    const { status = 'approved', category = 'full', feedback = '', paid_amount = 0 } = req.body;
    let connection;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    console.log(`[AdminAction] Updating enrollment ${enrollmentId} to status: ${status}, paid: ${paid_amount}`);
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [enrollmentRows] = await connection.execute(`
            SELECT e.*, u.name as user_name, u.email, b.name as batch_name, b.price, b.start_date, i.name as instructor_name,
            (SELECT SUM(amount) FROM payments WHERE enrollment_id = e.id AND status = 'completed') as existing_paid
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            JOIN batches b ON e.batch_id = b.id
            LEFT JOIN users i ON b.instructor_id = i.id
            WHERE e.id = ?
        `, [enrollmentId]);
        const enrollment = enrollmentRows[0];

        if (!enrollment) {
            console.error(`[AdminAction] Enrollment ${enrollmentId} not found`);
            throw new Error('Enrollment not found');
        }

        await connection.execute(`
            UPDATE enrollments 
            SET status = ?, rejection_category = ?, admin_feedback = ?, is_utr_updated = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [status, category, feedback, enrollmentId]);

        if (status === 'approved') {
            const [batchPriceRows] = await connection.execute(`SELECT price FROM batches WHERE id = (SELECT batch_id FROM enrollments WHERE id = ?)`, [enrollmentId]);
            const batchPrice = batchPriceRows[0]?.price || 0;
            
            const [existingPaidRows] = await connection.execute(`SELECT SUM(amount) as sum FROM payments WHERE enrollment_id = ? AND status = 'completed'`, [enrollmentId]);
            const existingPaidSum = existingPaidRows[0]?.sum || 0;
            
            const balance = (batchPrice) - (existingPaidSum);

            await connection.execute(`
                UPDATE payments 
                SET status = 'completed', 
                    amount = CASE WHEN amount = 0 THEN ? ELSE amount END 
                WHERE enrollment_id = ? AND status = 'pending'
            `, [balance, enrollmentId]);
        }

        const [updatedRows] = await connection.execute(`
            SELECT e.*, u.name as user_name, u.email, b.name as batch_name, c.name as course_name, b.price, b.start_date, b.broadcast_message, i.name as instructor_name,
            (SELECT SUM(amount) FROM payments WHERE enrollment_id = e.id AND status = 'completed') as paid_amount
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            JOIN batches b ON e.batch_id = b.id
            JOIN courses c ON b.course_id = c.id
            LEFT JOIN users i ON b.instructor_id = i.id
            WHERE e.id = ?
        `, [enrollmentId]);

        const updatedEnrollment = updatedRows[0];
        await connection.commit();

        if (status === 'approved') {
            try {
                await connection.execute(`
                    INSERT INTO student_activities (student_id, title, description, activity_type)
                    VALUES (?, ?, ?, 'enrollment')
                `, [
                    updatedEnrollment.student_id,
                    `Enrolled in ${updatedEnrollment.course_name}`,
                    `Enrollment for ${updatedEnrollment.course_name} (${updatedEnrollment.batch_name}) has been approved.`
                ]);
            } catch (aErr) {
                console.error("Activity logging error:", aErr.message);
            }

            notifyEnrollmentSuccess(
                { name: updatedEnrollment.user_name, email: updatedEnrollment.email },
                updatedEnrollment.batch_name,
                {
                    courseName: updatedEnrollment.course_name,
                    price: updatedEnrollment.price,
                    start_date: updatedEnrollment.start_date,
                    instructor_name: updatedEnrollment.instructor_name,
                    broadcast_message: updatedEnrollment.broadcast_message
                }
            ).catch(console.error);
            if (updatedEnrollment.broadcast_message) {
                const { notifyGuidelines } = require('../lib/emailService');
                notifyGuidelines(
                    [{ email: updatedEnrollment.email }],
                    updatedEnrollment.batch_name,
                    updatedEnrollment.broadcast_message
                ).catch(console.error);
            }
        } else if (status === 'rejected') {
            notifyEnrollmentRejected(
                { name: updatedEnrollment.user_name, email: updatedEnrollment.email },
                updatedEnrollment.batch_name,
                feedback
            ).catch(console.error);
        }

        res.json({ message: `Enrollment marked as ${status}.` });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error(`[ERROR] handleEnrollmentAction:`, err);
        res.status(400).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// DELETE /api/enrollments/:id - admin can delete any, student can delete their own REJECTED ones
router.delete('/:id', authenticateToken, async (req, res) => {
    const enrollmentId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        if (userRole === 'student') {
            const [enrollRows] = await connection.execute('SELECT status FROM enrollments WHERE id = ? AND student_id = ?', [enrollmentId, userId]);
            const enrollment = enrollRows[0];
            if (!enrollment) throw new Error('Enrollment not found or access denied.');
            if (enrollment.status !== 'rejected') throw new Error('Only rejected enrollments can be cleared by students.');
        }

        await connection.execute('DELETE FROM payments WHERE enrollment_id = ?', [enrollmentId]);
        await connection.execute('DELETE FROM enrollments WHERE id = ?', [enrollmentId]);

        await connection.commit();
        res.json({ message: 'Enrollment cleared successfully.' });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(400).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// PUT /api/enrollments/bulk-status - admin only
router.put('/bulk-status', authenticateToken, requireRole('admin'), async (req, res) => {
    const { ids, status, category = 'full', feedback = '' } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'IDs array required' });
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        for (const enrollmentId of ids) {
            // Update enrollment status
            await connection.execute(`
                UPDATE enrollments 
                SET status = ?, rejection_category = ?, admin_feedback = ?, is_utr_updated = 0, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [status, category, feedback, enrollmentId]);

            // Handle payment status shift if approved
            if (status === 'approved') {
                const [batchPriceRows] = await connection.execute(`SELECT price FROM batches WHERE id = (SELECT batch_id FROM enrollments WHERE id = ?)`, [enrollmentId]);
                const batchPrice = batchPriceRows[0]?.price || 0;
                
                const [existingPaidRows] = await connection.execute(`SELECT SUM(amount) as sum FROM payments WHERE enrollment_id = ? AND status = 'completed'`, [enrollmentId]);
                const existingPaidSum = existingPaidRows[0]?.sum || 0;
                
                const balance = Math.max(0, (batchPrice) - (existingPaidSum));

                await connection.execute(`
                    UPDATE payments 
                    SET status = 'completed', 
                        amount = CASE WHEN amount = 0 THEN ? ELSE amount END 
                    WHERE enrollment_id = ? AND status = 'pending'
                `, [balance, enrollmentId]);
            }

            // Fetch enrollment details for notifications
            const [enrollRows] = await connection.execute(`
                SELECT e.*, u.name as user_name, u.email, b.name as batch_name, c.name as course_name, b.price, b.start_date, b.broadcast_message, i.name as instructor_name
                FROM enrollments e
                JOIN users u ON e.student_id = u.id
                JOIN batches b ON e.batch_id = b.id
                JOIN courses c ON b.course_id = c.id
                LEFT JOIN users i ON b.instructor_id = i.id
                WHERE e.id = ?
            `, [enrollmentId]);
            
            const enrollment = enrollRows[0];
            if (enrollment) {
                if (status === 'approved') {
                    notifyEnrollmentSuccess(
                        { name: enrollment.user_name, email: enrollment.email },
                        enrollment.batch_name,
                        {
                            courseName: enrollment.course_name,
                            price: enrollment.price,
                            start_date: enrollment.start_date,
                            instructor_name: enrollment.instructor_name,
                            broadcast_message: enrollment.broadcast_message
                        }
                    ).catch(console.error);
                } else if (status === 'rejected') {
                    notifyEnrollmentRejected(
                        { name: enrollment.user_name, email: enrollment.email },
                        enrollment.batch_name,
                        feedback
                    ).catch(console.error);
                }
            }
        }

        await connection.commit();
        res.json({ message: `Bulk processed ${ids.length} enrollments.` });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Bulk process error:", err);
        res.status(500).json({ error: 'Failed to process bulk operation' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
