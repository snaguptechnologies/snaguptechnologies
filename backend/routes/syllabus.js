const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/syllabus/course/:courseId - Admin/Public course syllabus lookup
router.get('/course/:courseId', authenticateToken, requireRole('admin'), async (req, res) => {
    const { courseId } = req.params;
    try {
        const [courseRows] = await db.execute(`SELECT id, name, category, description, status FROM courses WHERE id = ?`, [courseId]);
        if (courseRows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        const course = courseRows[0];

        const [modules] = await db.execute(`
            SELECT id, course_id, title, description, sequence_order, status, created_at
            FROM course_modules
            WHERE course_id = ?
            ORDER BY sequence_order ASC, id ASC
        `, [courseId]);

        for (let mod of modules) {
            const [lessons] = await db.execute(`
                SELECT id, module_id, title, description, resource_url, video_url, sequence_order, status, created_at
                FROM course_lessons
                WHERE module_id = ?
                ORDER BY sequence_order ASC, id ASC
            `, [mod.id]);
            mod.lessons = lessons;
        }

        res.json({
            course,
            modules
        });
    } catch (err) {
        console.error('Syllabus Fetch Error:', err);
        res.status(500).json({ error: 'Failed to fetch course syllabus' });
    }
});

// POST /api/syllabus/course/:courseId/modules - Admin create module
router.post('/course/:courseId/modules', authenticateToken, requireRole('admin'), async (req, res) => {
    const { courseId } = req.params;
    const { title, description, sequence_order = 1, status = 'active' } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Module title is required.' });
    }

    const orderNum = parseInt(sequence_order);
    if (isNaN(orderNum) || orderNum < 1) {
        return res.status(400).json({ error: 'Sequence order must be a positive integer.' });
    }

    const validStatus = status === 'inactive' ? 'inactive' : 'active';

    try {
        const [courseRows] = await db.execute(`SELECT id FROM courses WHERE id = ?`, [courseId]);
        if (courseRows.length === 0) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        const [result] = await db.execute(`
            INSERT INTO course_modules (course_id, title, description, sequence_order, status)
            VALUES (?, ?, ?, ?, ?)
        `, [courseId, title.trim(), description || '', orderNum, validStatus]);

        const [newModuleRows] = await db.execute(`SELECT * FROM course_modules WHERE id = ?`, [result.insertId]);
        res.status(201).json({
            message: 'Module created successfully',
            module: { ...newModuleRows[0], lessons: [] }
        });
    } catch (err) {
        console.error('Create Module Error:', err);
        res.status(500).json({ error: 'Failed to create module' });
    }
});

// PUT /api/syllabus/modules/:moduleId - Admin update module
router.put('/modules/:moduleId', authenticateToken, requireRole('admin'), async (req, res) => {
    const { moduleId } = req.params;
    const { title, description, sequence_order, status } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Module title is required.' });
    }

    const orderNum = parseInt(sequence_order);
    if (isNaN(orderNum) || orderNum < 1) {
        return res.status(400).json({ error: 'Sequence order must be a positive integer.' });
    }

    const validStatus = status === 'inactive' ? 'inactive' : 'active';

    try {
        const [existing] = await db.execute(`SELECT id FROM course_modules WHERE id = ?`, [moduleId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Module not found.' });
        }

        await db.execute(`
            UPDATE course_modules
            SET title = ?, description = ?, sequence_order = ?, status = ?
            WHERE id = ?
        `, [title.trim(), description || '', orderNum, validStatus, moduleId]);

        const [updatedRows] = await db.execute(`SELECT * FROM course_modules WHERE id = ?`, [moduleId]);
        res.json({ message: 'Module updated successfully', module: updatedRows[0] });
    } catch (err) {
        console.error('Update Module Error:', err);
        res.status(500).json({ error: 'Failed to update module' });
    }
});

// DELETE /api/syllabus/modules/:moduleId - Admin delete module
router.delete('/modules/:moduleId', authenticateToken, requireRole('admin'), async (req, res) => {
    const { moduleId } = req.params;
    try {
        const [existing] = await db.execute(`SELECT id FROM course_modules WHERE id = ?`, [moduleId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Module not found.' });
        }

        await db.execute(`DELETE FROM course_modules WHERE id = ?`, [moduleId]);
        res.json({ message: 'Module and associated lessons deleted successfully' });
    } catch (err) {
        console.error('Delete Module Error:', err);
        res.status(500).json({ error: 'Failed to delete module' });
    }
});

// POST /api/syllabus/modules/:moduleId/lessons - Admin create lesson
router.post('/modules/:moduleId/lessons', authenticateToken, requireRole('admin'), async (req, res) => {
    const { moduleId } = req.params;
    const { title, description, resource_url, video_url, sequence_order = 1, status = 'active' } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Lesson title is required.' });
    }

    const orderNum = parseInt(sequence_order);
    if (isNaN(orderNum) || orderNum < 1) {
        return res.status(400).json({ error: 'Sequence order must be a positive integer.' });
    }

    const validStatus = status === 'inactive' ? 'inactive' : 'active';

    try {
        const [moduleRows] = await db.execute(`SELECT id FROM course_modules WHERE id = ?`, [moduleId]);
        if (moduleRows.length === 0) {
            return res.status(404).json({ error: 'Parent module not found.' });
        }

        const [result] = await db.execute(`
            INSERT INTO course_lessons (module_id, title, description, resource_url, video_url, sequence_order, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [moduleId, title.trim(), description || '', resource_url || '', video_url || '', orderNum, validStatus]);

        const [newLessonRows] = await db.execute(`SELECT * FROM course_lessons WHERE id = ?`, [result.insertId]);
        res.status(201).json({
            message: 'Lesson created successfully',
            lesson: newLessonRows[0]
        });
    } catch (err) {
        console.error('Create Lesson Error:', err);
        res.status(500).json({ error: 'Failed to create lesson' });
    }
});

// PUT /api/syllabus/lessons/:lessonId - Admin update lesson
router.put('/lessons/:lessonId', authenticateToken, requireRole('admin'), async (req, res) => {
    const { lessonId } = req.params;
    const { title, description, resource_url, video_url, sequence_order, status } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Lesson title is required.' });
    }

    const orderNum = parseInt(sequence_order);
    if (isNaN(orderNum) || orderNum < 1) {
        return res.status(400).json({ error: 'Sequence order must be a positive integer.' });
    }

    const validStatus = status === 'inactive' ? 'inactive' : 'active';

    try {
        const [existing] = await db.execute(`SELECT id FROM course_lessons WHERE id = ?`, [lessonId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Lesson not found.' });
        }

        await db.execute(`
            UPDATE course_lessons
            SET title = ?, description = ?, resource_url = ?, video_url = ?, sequence_order = ?, status = ?
            WHERE id = ?
        `, [title.trim(), description || '', resource_url || '', video_url || '', orderNum, validStatus, lessonId]);

        const [updatedRows] = await db.execute(`SELECT * FROM course_lessons WHERE id = ?`, [lessonId]);
        res.json({ message: 'Lesson updated successfully', lesson: updatedRows[0] });
    } catch (err) {
        console.error('Update Lesson Error:', err);
        res.status(500).json({ error: 'Failed to update lesson' });
    }
});

// DELETE /api/syllabus/lessons/:lessonId - Admin delete lesson
router.delete('/lessons/:lessonId', authenticateToken, requireRole('admin'), async (req, res) => {
    const { lessonId } = req.params;
    try {
        const [existing] = await db.execute(`SELECT id FROM course_lessons WHERE id = ?`, [lessonId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Lesson not found.' });
        }

        await db.execute(`DELETE FROM course_lessons WHERE id = ?`, [lessonId]);
        res.json({ message: 'Lesson deleted successfully' });
    } catch (err) {
        console.error('Delete Lesson Error:', err);
        res.status(500).json({ error: 'Failed to delete lesson' });
    }
});

// GET /api/syllabus/student/course/:courseId - Student fetch active syllabus
router.get('/student/course/:courseId', authenticateToken, requireRole('student'), async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    try {
        // Verify approved enrollment for this course
        const [enrollmentRows] = await db.execute(`
            SELECT e.id
            FROM enrollments e
            JOIN batches b ON e.batch_id = b.id
            WHERE e.student_id = ? AND b.course_id = ? AND e.status = 'approved'
        `, [studentId, courseId]);

        if (enrollmentRows.length === 0) {
            return res.status(403).json({ error: 'Access denied. You do not have an approved enrollment for this course.' });
        }

        const [courseRows] = await db.execute(`SELECT id, name, category, description FROM courses WHERE id = ?`, [courseId]);
        if (courseRows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        const course = courseRows[0];

        // Fetch active modules
        const [modules] = await db.execute(`
            SELECT id, course_id, title, description, sequence_order
            FROM course_modules
            WHERE course_id = ? AND status = 'active'
            ORDER BY sequence_order ASC, id ASC
        `, [courseId]);

        // Fetch active lessons for each active module
        for (let mod of modules) {
            const [lessons] = await db.execute(`
                SELECT id, module_id, title, description, resource_url, video_url, sequence_order
                FROM course_lessons
                WHERE module_id = ? AND status = 'active'
                ORDER BY sequence_order ASC, id ASC
            `, [mod.id]);
            mod.lessons = lessons;
        }

        res.json({
            course,
            modules
        });
    } catch (err) {
        console.error('Student Syllabus Fetch Error:', err);
        res.status(500).json({ error: 'Failed to fetch syllabus' });
    }
});

module.exports = router;
