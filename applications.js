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

module.exports = router;
