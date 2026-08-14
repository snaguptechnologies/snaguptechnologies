const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    notifyStudentsOfInstructorNote,
    notifyInstructorOfUpdate,
    formatTimeAMPM,
    sendEmail
} = require('../lib/emailService');

// POST /api/sessions/plan - instructor/admin
router.post('/plan', authenticateToken, async (req, res) => {
    const { batch_id, date, time, link, message } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!batch_id || !date || !time || !link) {
        return res.status(400).json({ error: 'Batch ID, Date, Time, and Link are required.' });
    }

    let connection;
    try {
        const [batchRows] = await db.execute(`
            SELECT b.*, c.name as course_name, u.email as instructor_email, u.name as instructor_name
            FROM batches b 
            JOIN courses c ON b.course_id = c.id 
            LEFT JOIN users u ON b.instructor_id = u.id
            WHERE b.id = ?
        `, [batch_id]);
        
        const batch = batchRows[0];
        if (!batch) return res.status(404).json({ error: 'Batch not found.' });

        if (['completed', 'closed'].includes(batch.batch_status) || batch.archived_at) {
            return res.status(403).json({ error: 'Cannot plan sessions for a completed or closed batch.' });
        }

        if (userRole !== 'admin') {
            if (batch.instructor_id !== userId) {
                return res.status(403).json({ error: 'You are not authorized to plan sessions for this batch.' });
            }
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Upsert into sessions table.
        await connection.execute(`
            INSERT INTO sessions (batch_id, date, time, link, message, notified_times)
            VALUES (?, ?, ?, ?, ?, '[]')
            ON DUPLICATE KEY UPDATE 
                time           = VALUES(time), 
                link           = VALUES(link), 
                message        = VALUES(message),
                notified_times = '[]'
        `, [batch_id, date, time, link || null, message || '']);

        // 2. Update the main batches table with the "latest/current" session info
        await connection.execute(`
            UPDATE batches 
            SET session_link = ?, session_time = ?, session_date = ?, session_message = ?
            WHERE id = ?
        `, [link || null, time, date, message || '', batch_id]);

        // 3. Initialize attendance for this date
        const [students] = await connection.execute(`SELECT student_id FROM enrollments WHERE batch_id = ? AND status = 'approved'`, [batch_id]);
        
        if (students.length > 0) {
            const values = students.map(() => '(?, ?, ?, \'present\', ?)').join(', ');
            const params = students.flatMap(s => [s.student_id, batch_id, date, userId]);
            await connection.execute(`
                INSERT IGNORE INTO attendance (student_id, batch_id, date, status, marked_by)
                VALUES ${values}
            `, params);
        }

        await connection.commit();

        // 4. Student notifications
        const [approvedStudents] = await db.execute(`
            SELECT u.email, u.name FROM users u
            JOIN enrollments e ON u.id = e.student_id
            WHERE e.batch_id = ? AND e.status = 'approved'
        `, [batch_id]);

        const formattedTime = formatTimeAMPM(time);

        if (approvedStudents.length > 0 && link && link.trim().length > 0 && batch.is_finalized) {
            for (const student of approvedStudents) {
                sendEmail({
                    to: student.email,
                    subject: `Session Scheduled | ${batch.course_name} — ${batch.name}`,
                    body: `Hi ${student.name},\n\nYour upcoming session has been scheduled.\n\nCourse: ${batch.course_name}\nBatch: ${batch.name}\nDate: ${date}\nTime: ${formattedTime} IST\nJoin Link: ${link}${message ? `\n\nNote from instructor: ${message}` : ''}\n\n— Snagup Technologies`,
                    html: `<div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:36px;border:2px solid #000;background:#fff;color:#000">
                        <div style="border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px">
                            <h1 style="margin:0;font-size:18px;font-weight:900;text-transform:uppercase">Snagup Technologies</h1>
                            <p style="margin:4px 0 0;font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#555">E-Learning Excellence</p>
                        </div>
                        <h2 style="margin:0 0 4px;font-size:22px;font-weight:900;text-transform:uppercase">Session Scheduled ✓</h2>
                        <p style="margin:0 0 24px;font-size:13px;color:#555">Hi ${student.name}, your upcoming live session has been confirmed. You can join using the button below.</p>
                        <div style="border:2px solid #000;padding:20px;margin-bottom:20px">
                            <table style="width:100%;border-collapse:collapse">
                                <tr><td style="padding:5px 0;font-size:13px;font-weight:700;width:80px">Course:</td><td style="font-size:13px;font-weight:900">${batch.course_name}</td></tr>
                                <tr><td style="padding:5px 0;font-size:13px;font-weight:700">Batch:</td><td style="font-size:13px">${batch.name}</td></tr>
                                <tr><td style="padding:5px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#666">Schedule:</td><td style="font-size:13px;font-weight:700">${date && typeof date === 'string' ? date.split('T')[0] : date} @ ${formattedTime} IST</td></tr>
                            </table>
                            <div style="margin-top:20px;text-align:center">
                                <a href="${link}" style="display:inline-block;background:#000;color:#fff;padding:14px 28px;text-decoration:none;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:.1em">Join Session Now →</a>
                            </div>
                            ${message ? `<div style="margin-top:20px;padding-top:12px;border-top:1px dashed #000"><p style="margin:0 0 4px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em">Note from Instructor</p><p style="margin:0;font-size:13px;font-style:italic">"${message}"</p></div>` : ''}
                        </div>
                        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
                            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
                        </div>
                    </div>`,
                    purpose: 'Session Scheduled'
                }).catch(err => console.error("[Sessions] Failed to send session confirmation to", student.email, ":", err));
            }
        } else if (approvedStudents.length > 0 && message && message.trim().length > 0 && !link) {
            notifyStudentsOfInstructorNote(approvedStudents, batch.name, message)
                .catch(err => console.error("[Sessions] Failed to send instructor note:", err));
        }

        // 5. Notify the Instructor (confirms their scheduled action)
        if (batch.instructor_email) {
            notifyInstructorOfUpdate(
                batch.instructor_email,
                batch.instructor_name || 'Instructor',
                batch.course_name || 'Course',
                batch.name,
                link ? 'Session Planned' : 'Session Update',
                `Scheduled for <strong>${date && typeof date === 'string' ? date.split('T')[0] : date}</strong> starting at <strong>${formattedTime}</strong>.${message ? `<br><br><strong>Note to students:</strong> ${message}` : ''}`
            ).catch(err => console.error("[Sessions] Failed to notify instructor:", err));
        }

        res.json({ message: 'Session planned successfully. Confirmation emails sent to students.' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error planning session:', err);
        res.status(500).json({ error: 'An internal server error occurred while planning the session.' });
    } finally {
        if (connection) connection.release();
    }
});

// POST /api/sessions/remind/:batch_id - Manual reminder button
router.post('/remind/:batch_id', authenticateToken, async (req, res) => {
    const { batch_id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const [batchRows] = await db.execute(`
            SELECT b.*, c.name as course_name 
            FROM batches b 
            JOIN courses c ON b.course_id = c.id 
            WHERE b.id = ?
        `, [batch_id]);
        const batch = batchRows[0];

        if (!batch) return res.status(404).json({ error: 'Batch not found.' });

        if (userRole !== 'admin' && batch.instructor_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized.' });
        }

        if (!batch.session_link) {
            return res.status(400).json({ error: 'No active session link found for this batch.' });
        }

        const [approvedStudents] = await db.execute(`
            SELECT u.email, u.name FROM users u
            JOIN enrollments e ON u.id = e.student_id
            WHERE e.batch_id = ? AND e.status = 'approved'
        `, [batch_id]);

        if (approvedStudents.length === 0) {
            return res.status(400).json({ error: 'No approved students found in this batch.' });
        }

        const formattedTime = formatTimeAMPM(batch.session_time);

        const nowUTC = new Date();
        const [hours, mins] = batch.session_time.split(':').map(Number);
        
        // Fix string split if batch.session_date is a Date object (expected under mysql datetime)
        const dateString = batch.session_date instanceof Date ? batch.session_date.toISOString().split('T')[0] : batch.session_date.split('T')[0];
        const [sYear, sMonth, sDay] = dateString.split('-').map(Number);

        const sessionIST_ms = Date.UTC(sYear, sMonth - 1, sDay, hours, mins, 0, 0) - (5.5 * 60 * 60 * 1000);
        const diffMs = sessionIST_ms - nowUTC.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        let timeStatusText = "is about to start soon";
        if (diffMins > 10) {
            const h = Math.floor(diffMins / 60);
            const m = diffMins % 60;
            if (h > 0) {
                timeStatusText = `is starting in ${h} hour${h > 1 ? 's' : ''} and ${m} minute${m !== 1 ? 's' : ''}`;
            } else {
                timeStatusText = `is starting in ${m} minute${m !== 1 ? 's' : ''}`;
            }
        } else if (diffMins < 0) {
            timeStatusText = "has already started";
        }

        for (const student of approvedStudents) {
            sendEmail({
                to: student.email,
                subject: `Session Reminder | ${batch.course_name} — ${batch.name}`,
                body: `Hi ${student.name},\n\nThis is a reminder for your session.\n\nCourse: ${batch.course_name}\nBatch: ${batch.name}\nDate: ${dateString}\nTime: ${formattedTime} IST\nJoin Link: ${batch.session_link}\n\n— Snagup Technologies`,
                html: `<div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:36px;border:2px solid #000;background:#fff;color:#000">
                    <div style="border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px">
                        <h1 style="margin:0;font-size:18px;font-weight:900;text-transform:uppercase">Snagup Technologies</h1>
                        <p style="margin:4px 0 0;font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#555">E-Learning Excellence</p>
                    </div>
                    <h2 style="margin:0 0 4px;font-size:22px;font-weight:900;text-transform:uppercase">Session Reminder 🔔</h2>
                    <p style="margin:0 0 24px;font-size:13px;color:#555">Hi ${student.name}, your session ${timeStatusText}. Click below to join.</p>
                    <div style="border:2px solid #000;padding:20px;margin-bottom:20px">
                        <table style="width:100%;border-collapse:collapse">
                            <tr><td style="padding:5px 0;font-size:13px;font-weight:700;width:80px">Course:</td><td style="font-size:13px;font-weight:900">${batch.course_name}</td></tr>
                            <tr><td style="padding:5px 0;font-size:13px;font-weight:700">Batch:</td><td style="font-size:13px">${batch.name}</td></tr>
                            <tr><td style="padding:5px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#666">Schedule:</td><td style="font-size:13px;font-weight:700">${dateString} @ ${formattedTime} IST</td></tr>
                        </table>
                        <div style="margin-top:20px;text-align:center">
                            <a href="${batch.session_link}" style="display:inline-block;background:#000;color:#fff;padding:14px 28px;text-decoration:none;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:.1em">Join Session Now →</a>
                        </div>
                        ${batch.session_message ? `<div style="margin-top:20px;padding-top:12px;border-top:1px dashed #000"><p style="margin:0 0 4px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em">Note from Instructor</p><p style="margin:0;font-size:13px;font-style:italic">"${batch.session_message}"</p></div>` : ''}
                    </div>
                    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
                            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
                        </div>
                </div>`,
                purpose: 'Manual Session Reminder'
            });
        }

        res.json({ message: `Reminder email sent to ${approvedStudents.length} students.` });
    } catch (err) {
        console.error('Error sending manual reminder:', err);
        res.status(500).json({ error: 'Failed to send reminders.' });
    }
});

module.exports = router;
