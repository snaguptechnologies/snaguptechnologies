const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordApplicationInExcel } = require('../lib/excelService');
const { notifyAdminNewApplication } = require('../lib/emailService');

// POST /api/applications — Submit a new course application (Student auth)
router.post('/', authenticateToken, requireRole('student'), async (req, res) => {
    const student_id = req.user.id;
    const {
        student_name,
        phone,
        email,
        college_name,
        college_register_id,
        whatsapp_number,
        course_name,
        course_id
    } = req.body;

    if (!student_name || !phone || !email || !college_name || !course_name) {
        return res.status(400).json({ error: 'Please provide all required fields (Name, Phone, Email, College, Course).' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Resolve course_id if not explicitly provided
        let resolvedCourseId = course_id || null;
        if (!resolvedCourseId && course_name) {
            const [cRows] = await connection.execute(
                'SELECT id FROM courses WHERE name = ? OR name LIKE ? LIMIT 1',
                [course_name, `%${course_name}%`]
            );
            if (cRows.length > 0) {
                resolvedCourseId = cRows[0].id;
            }
        }

        // 2. Generate unique Application ID: APP-YYYYMMDD-RANDOM
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const appId = `APP-${dateStr}-${randomNum}`;

        const whatsappNum = whatsapp_number || phone;

        // 3. Insert application into MySQL database
        const [appResult] = await connection.execute(`
            INSERT INTO course_applications 
            (app_id, student_id, student_name, phone, email, college_name, college_register_id, whatsapp_number, course_id, course_name, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Applied')
        `, [
            appId,
            student_id,
            student_name,
            phone,
            email,
            college_name,
            college_register_id || null,
            whatsappNum,
            resolvedCourseId,
            course_name
        ]);

        const insertedId = appResult.insertId;

        // 4. Log student activity in MySQL
        await connection.execute(`
            INSERT INTO student_activities
            (student_id, title, description, activity_type)
            VALUES (?, ?, ?, 'application')
        `, [
            student_id,
            `Applied for ${course_name}`,
            `Application ID: ${appId} submitted successfully.`
        ]);

        // Commit DB transaction first
        await connection.commit();

        const applicationData = {
            id: insertedId,
            app_id: appId,
            student_id,
            student_name,
            phone,
            email,
            college_name,
            college_register_id: college_register_id || '',
            whatsapp_number: whatsappNum,
            course_id: resolvedCourseId,
            course_name,
            status: 'Applied',
            enrollment_status: 'Applied',
            created_at: now
        };

        // 5. Append/update server-side Excel application report
        recordApplicationInExcel(applicationData);

        // 6. Send admin email notification
        notifyAdminNewApplication(applicationData).catch(err => {
            console.error('Failed sending admin notification email:', err);
        });

        res.status(201).json({
            message: 'Course application submitted successfully.',
            application: applicationData
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Application Submission Error:', err);
        res.status(500).json({ error: err.message || 'Failed to submit course application.' });
    } finally {
        if (connection) connection.release();
    }
});

// GET /api/applications/my — Fetch logged-in student's applications
router.get('/my', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const student_id = req.user.id;
        const [applications] = await db.execute(`
            SELECT ca.*, 
                   DATE_FORMAT(ca.created_at, '%Y-%m-%dT%H:%i:%sZ') as created_at,
                   DATE_FORMAT(ca.updated_at, '%Y-%m-%dT%H:%i:%sZ') as updated_at
            FROM course_applications ca
            WHERE ca.student_id = ?
            ORDER BY ca.created_at DESC
        `, [student_id]);

        res.json(applications);
    } catch (err) {
        console.error('Error fetching student applications:', err);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// GET /api/applications/activities — Fetch student activity logs
router.get('/activities', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const student_id = req.user.id;
        const [activities] = await db.execute(`
            SELECT sa.*,
                   DATE_FORMAT(sa.created_at, '%Y-%m-%dT%H:%i:%sZ') as created_at
            FROM student_activities sa
            WHERE sa.student_id = ?
            ORDER BY sa.created_at DESC
            LIMIT 50
        `, [student_id]);

        res.json(activities);
    } catch (err) {
        console.error('Error fetching student activities:', err);
        res.status(500).json({ error: 'Failed to fetch activity history' });
    }
});

// GET /api/applications/admin — Admin list of all applications
router.get('/admin', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const [applications] = await db.execute(`
            SELECT ca.*,
                   DATE_FORMAT(ca.created_at, '%Y-%m-%dT%H:%i:%sZ') as created_at,
                   DATE_FORMAT(ca.updated_at, '%Y-%m-%dT%H:%i:%sZ') as updated_at
            FROM course_applications ca
            ORDER BY ca.created_at DESC
        `);

        res.json(applications);
    } catch (err) {
        console.error('Error fetching admin applications:', err);
        res.status(500).json({ error: 'Failed to fetch applications for admin' });
    }
});

// PUT /api/applications/:id/status — Admin update application status & unify enrollment
router.put('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
    const applicationId = req.params.id;
    const { status } = req.body;

    const allowedStatuses = ['Applied', 'Enrolled', 'In Progress', 'Completed', 'Rejected'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Verify application exists (support numeric id or app_id string)
        const [appRows] = await connection.execute(
            `SELECT * FROM course_applications WHERE id = ? OR app_id = ? LIMIT 1`,
            [applicationId, applicationId]
        );
        const application = appRows[0];

        if (!application) {
            await connection.rollback();
            return res.status(404).json({ error: 'Course application not found.' });
        }

        const studentId = application.student_id;
        let courseId = application.course_id;
        const courseName = application.course_name;

        // 2. Resolve course_id if not present
        if (!courseId && courseName) {
            const [cRows] = await connection.execute(
                'SELECT id FROM courses WHERE name = ? OR name LIKE ? LIMIT 1',
                [courseName, `%${courseName}%`]
            );
            if (cRows.length > 0) {
                courseId = cRows[0].id;
                await connection.execute('UPDATE course_applications SET course_id = ? WHERE id = ?', [courseId, application.id]);
            }
        }

        let createdEnrollment = null;

        // 3. If status is set to 'Enrolled', perform enrollment creation & batch assignment
        if (status === 'Enrolled' && courseId) {
            // Find existing eligible batch for this course
            const [batches] = await connection.execute(
                `SELECT id FROM batches WHERE course_id = ? AND batch_status NOT IN ('closed', 'completed') AND is_finalized = 0 ORDER BY id ASC LIMIT 1`,
                [courseId]
            );

            let batchId;
            if (batches.length === 0) {
                const [allBatches] = await connection.execute(
                    `SELECT COUNT(*) as total FROM batches WHERE course_id = ?`,
                    [courseId]
                );
                if (allBatches[0].total > 0) {
                    await connection.rollback();
                    return res.status(400).json({
                        error: 'No eligible batch available for this course. Existing batches are closed, completed, or finalized.'
                    });
                }
                const [cRows] = await connection.execute(`SELECT name FROM courses WHERE id = ?`, [courseId]);
                const cName = cRows[0]?.name || courseName || 'Course';
                const [newBatch] = await connection.execute(`
                    INSERT INTO batches (course_id, name, batch_status, enrollment_status, duration_days, price)
                    VALUES (?, ?, 'active', 'open', 30, 0)
                `, [courseId, `${cName} - Default Cohort`]);
                batchId = newBatch.insertId;
            } else {
                batchId = batches[0].id;
            }

            // Check if student is already enrolled in a batch for this course
            const [existingEnrollments] = await connection.execute(
                `SELECT e.id, e.status, e.batch_id FROM enrollments e JOIN batches b ON e.batch_id = b.id WHERE e.student_id = ? AND b.course_id = ?`,
                [studentId, courseId]
            );

            if (existingEnrollments.length > 0) {
                const existing = existingEnrollments[0];
                if (existing.status !== 'approved') {
                    // Update existing enrollment to approved
                    await connection.execute(
                        `UPDATE enrollments SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                        [existing.id]
                    );
                }
                createdEnrollment = { id: existing.id, batch_id: existing.batch_id, status: 'approved', duplicate: true };
            } else {
                // Insert new enrollment record
                const [enrollmentResult] = await connection.execute(
                    `INSERT INTO enrollments (student_id, batch_id, status) VALUES (?, ?, 'approved')`,
                    [studentId, batchId]
                );
                const enrollmentId = enrollmentResult.insertId;
                createdEnrollment = { id: enrollmentId, batch_id: batchId, status: 'approved', duplicate: false };
            }
        }

        // 4. Update course_applications status
        await connection.execute(
            `UPDATE course_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [status, application.id]
        );

        await connection.commit();

        res.json({
            message: `Application updated to ${status}.` + (createdEnrollment ? ' Student enrolled successfully.' : ''),
            application_id: application.id,
            status,
            enrollment: createdEnrollment
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error updating application status:', err);
        res.status(500).json({ error: err.message || 'Failed to update application status.' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;

