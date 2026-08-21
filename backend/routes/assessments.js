const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Helper to check if instructor teaches any batch for a given course
async function verifyInstructorCourseAccess(instructorId, courseId) {
    const [rows] = await db.execute(`SELECT id FROM batches WHERE instructor_id = ? AND course_id = ? LIMIT 1`, [instructorId, courseId]);
    return rows.length > 0;
}

// Helper to check if instructor teaches any batch for the course associated with an assessment
async function verifyInstructorAssessmentAccess(instructorId, assessmentId) {
    const [assRows] = await db.execute(`SELECT course_id FROM assessments WHERE id = ?`, [assessmentId]);
    if (assRows.length === 0) return false;
    return await verifyInstructorCourseAccess(instructorId, assRows[0].course_id);
}

// ==========================================
// STUDENT ENDPOINTS
// ==========================================

// GET /api/assessments/student/batch/:batchId
// Returns active assessments for the course associated with student's approved batch enrollment,
// including attempt counts, best score, and remaining attempts.
router.get('/student/batch/:batchId', authenticateToken, requireRole('student'), async (req, res) => {
    const { batchId } = req.params;
    const studentId = req.user.id;

    try {
        // 1. Verify approved enrollment for student in this batch
        const [enrollmentRows] = await db.execute(`
            SELECT e.id, b.course_id, c.name as course_name
            FROM enrollments e
            JOIN batches b ON e.batch_id = b.id
            JOIN courses c ON b.course_id = c.id
            WHERE e.student_id = ? AND e.batch_id = ? AND e.status = 'approved'
        `, [studentId, batchId]);

        if (enrollmentRows.length === 0) {
            return res.status(403).json({ error: 'Access denied. You do not have an approved enrollment in this batch.' });
        }

        const courseId = enrollmentRows[0].course_id;

        // 2. Fetch active assessments for this course
        const [assessments] = await db.execute(`
            SELECT a.id, a.course_id, a.module_id, a.title, a.description, 
                   a.pass_percentage, a.time_limit_mins, a.max_attempts, a.status, a.created_at,
                   cm.title as module_title,
                   (SELECT COUNT(*) FROM assessment_questions WHERE assessment_id = a.id) as question_count
            FROM assessments a
            LEFT JOIN course_modules cm ON a.module_id = cm.id
            WHERE a.course_id = ? AND a.status = 'active'
            ORDER BY cm.sequence_order ASC, a.created_at ASC
        `, [courseId]);

        // 3. Attach student attempt summary for each assessment (without exposing correct_option_index or answers_json)
        const result = [];
        for (let ass of assessments) {
            const [attempts] = await db.execute(`
                SELECT id, score_obtained, total_points, percentage, is_passed, attempt_number, status, started_at, submitted_at
                FROM assessment_attempts
                WHERE student_id = ? AND batch_id = ? AND assessment_id = ?
                ORDER BY attempt_number DESC
            `, [studentId, batchId, ass.id]);

            const completedAttempts = attempts.filter(a => a.status === 'completed');
            const inProgressAttempt = attempts.find(a => a.status === 'in_progress');
            const attemptCount = completedAttempts.length;
            const isPassed = completedAttempts.some(a => a.is_passed === 1 || a.is_passed === true);
            const bestPercentage = completedAttempts.length > 0
                ? Math.max(...completedAttempts.map(a => Number(a.percentage)))
                : 0;

            const maxAtt = Number(ass.max_attempts || 0);
            const remainingAttempts = maxAtt === 0 ? 'unlimited' : Math.max(0, maxAtt - attemptCount);

            result.push({
                id: ass.id,
                course_id: ass.course_id,
                module_id: ass.module_id,
                module_title: ass.module_title || null,
                title: ass.title,
                description: ass.description || '',
                pass_percentage: Number(ass.pass_percentage || 70),
                time_limit_mins: Number(ass.time_limit_mins || 0),
                max_attempts: maxAtt,
                status: ass.status,
                question_count: Number(ass.question_count || 0),
                attempt_count: attemptCount,
                remaining_attempts: remainingAttempts,
                is_passed: isPassed,
                best_percentage: Number(bestPercentage.toFixed(2)),
                has_in_progress: !!inProgressAttempt,
                in_progress_attempt_id: inProgressAttempt ? inProgressAttempt.id : null,
                attempts: completedAttempts.map(a => ({
                    attempt_id: a.id,
                    attempt_number: a.attempt_number,
                    score_obtained: a.score_obtained,
                    total_points: a.total_points,
                    percentage: Number(a.percentage),
                    is_passed: !!a.is_passed,
                    submitted_at: a.submitted_at
                }))
            });
        }

        res.json({
            course_name: enrollmentRows[0].course_name,
            assessments: result
        });
    } catch (err) {
        console.error('Student Assessments Fetch Error:', err);
        res.status(500).json({ error: 'Failed to fetch assessments.' });
    }
});

// POST /api/assessments/:id/start
// Student starts a new attempt or resumes an existing in_progress attempt.
// Returns questions WITHOUT correct_option_index.
router.post('/:id/start', authenticateToken, requireRole('student'), async (req, res) => {
    const assessmentId = req.params.id;
    const studentId = req.user.id;

    try {
        // 1. Fetch assessment
        const [assRows] = await db.execute(`SELECT * FROM assessments WHERE id = ?`, [assessmentId]);
        if (assRows.length === 0) {
            return res.status(404).json({ error: 'Assessment not found.' });
        }
        const assessment = assRows[0];
        if (assessment.status !== 'active') {
            return res.status(400).json({ error: 'This assessment is currently inactive.' });
        }

        // 2. Verify approved enrollment for student in a batch for this course
        const [enrollmentRows] = await db.execute(`
            SELECT e.batch_id
            FROM enrollments e
            JOIN batches b ON e.batch_id = b.id
            WHERE e.student_id = ? AND b.course_id = ? AND e.status = 'approved'
            ORDER BY e.enrolled_at DESC
            LIMIT 1
        `, [studentId, assessment.course_id]);

        if (enrollmentRows.length === 0) {
            return res.status(403).json({ error: 'Access denied. You do not have an approved enrollment for this course.' });
        }
        const batchId = enrollmentRows[0].batch_id;

        // 3. Check for existing in_progress attempt for this student + assessment + batch
        const [existingInProgress] = await db.execute(`
            SELECT * FROM assessment_attempts
            WHERE student_id = ? AND batch_id = ? AND assessment_id = ? AND status = 'in_progress'
            ORDER BY id DESC LIMIT 1
        `, [studentId, batchId, assessmentId]);

        let activeAttempt = null;

        if (existingInProgress.length > 0) {
            const candidate = existingInProgress[0];
            const timeLimitMins = Number(assessment.time_limit_mins || 0);

            // If time limit exists, check if attempt has expired server-side
            if (timeLimitMins > 0) {
                const startTime = new Date(candidate.started_at).getTime();
                const nowTime = Date.now();
                const elapsedMins = (nowTime - startTime) / (1000 * 60);

                if (elapsedMins > (timeLimitMins + 1)) {
                    // Time expired! Auto-finalize attempt with 0 or recorded answers
                    await db.execute(`
                        UPDATE assessment_attempts
                        SET status = 'completed', submitted_at = NOW(), score_obtained = 0, percentage = 0, is_passed = 0
                        WHERE id = ?
                    `, [candidate.id]);
                } else {
                    activeAttempt = candidate;
                }
            } else {
                activeAttempt = candidate;
            }
        }

        // 4. If no valid active in_progress attempt, create a new attempt
        if (!activeAttempt) {
            // Count completed attempts to check max_attempts
            const [completedRows] = await db.execute(`
                SELECT COUNT(*) as count FROM assessment_attempts
                WHERE student_id = ? AND batch_id = ? AND assessment_id = ? AND status = 'completed'
            `, [studentId, batchId, assessmentId]);

            const completedCount = completedRows[0].count;
            const maxAtt = Number(assessment.max_attempts || 0);

            if (maxAtt > 0 && completedCount >= maxAtt) {
                return res.status(403).json({ error: `Maximum attempts (${maxAtt}) reached for this assessment.` });
            }

            // Verify assessment has questions
            const [qCountRows] = await db.execute(`
                SELECT COUNT(*) as count FROM assessment_questions WHERE assessment_id = ?
            `, [assessmentId]);

            if (qCountRows[0].count === 0) {
                return res.status(400).json({ error: 'This assessment does not contain any questions yet.' });
            }

            const nextAttemptNum = completedCount + 1;

            const [createResult] = await db.execute(`
                INSERT INTO assessment_attempts (assessment_id, student_id, batch_id, attempt_number, status, started_at)
                VALUES (?, ?, ?, ?, 'in_progress', NOW())
            `, [assessmentId, studentId, batchId, nextAttemptNum]);

            const [newAttemptRows] = await db.execute(`SELECT * FROM assessment_attempts WHERE id = ?`, [createResult.insertId]);
            activeAttempt = newAttemptRows[0];
        }

        // 5. Fetch questions WITHOUT correct_option_index
        const [questions] = await db.execute(`
            SELECT id, question_text, question_type, options_json, points, sequence_order
            FROM assessment_questions
            WHERE assessment_id = ?
            ORDER BY sequence_order ASC, id ASC
        `, [assessmentId]);

        const formattedQuestions = questions.map(q => {
            let options = [];
            try {
                options = typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json;
            } catch (e) {
                options = [];
            }
            return {
                id: q.id,
                question_text: q.question_text,
                question_type: q.question_type,
                options,
                points: Number(q.points || 1),
                sequence_order: Number(q.sequence_order || 1)
            };
        });

        res.json({
            attempt_id: activeAttempt.id,
            assessment_id: Number(assessmentId),
            assessment_title: assessment.title,
            attempt_number: activeAttempt.attempt_number,
            started_at: activeAttempt.started_at,
            time_limit_mins: Number(assessment.time_limit_mins || 0),
            pass_percentage: Number(assessment.pass_percentage || 70),
            questions: formattedQuestions
        });
    } catch (err) {
        console.error('Start Assessment Error:', err);
        res.status(500).json({ error: 'Failed to start assessment.' });
    }
});

// POST /api/assessments/:id/submit
// Student submits answers for an active attempt.
// Computes score and pass status server-side. Never trusts client scores.
router.post('/:id/submit', authenticateToken, requireRole('student'), async (req, res) => {
    const assessmentId = req.params.id;
    const studentId = req.user.id;
    const { attempt_id, answers } = req.body;

    if (!attempt_id) {
        return res.status(400).json({ error: 'Attempt ID is required.' });
    }

    try {
        // 1. Fetch attempt
        const [attemptRows] = await db.execute(`
            SELECT * FROM assessment_attempts
            WHERE id = ? AND student_id = ? AND assessment_id = ?
        `, [attempt_id, studentId, assessmentId]);

        if (attemptRows.length === 0) {
            return res.status(404).json({ error: 'Attempt record not found or access denied.' });
        }

        const attempt = attemptRows[0];

        // 2. Prevent duplicate submissions
        if (attempt.status === 'completed') {
            return res.status(400).json({ error: 'This attempt has already been submitted and graded.' });
        }

        // 3. Fetch assessment details
        const [assRows] = await db.execute(`SELECT pass_percentage, time_limit_mins FROM assessments WHERE id = ?`, [assessmentId]);
        if (assRows.length === 0) {
            return res.status(404).json({ error: 'Assessment not found.' });
        }
        const assessment = assRows[0];
        const passPct = Number(assessment.pass_percentage || 70);

        // 4. Fetch correct answer keys for grading
        const [questions] = await db.execute(`
            SELECT id, correct_option_index, points
            FROM assessment_questions
            WHERE assessment_id = ?
        `, [assessmentId]);

        let totalPoints = 0;
        let scoreObtained = 0;
        const submittedAnswers = answers || {};

        for (let q of questions) {
            const pts = Number(q.points || 1);
            totalPoints += pts;

            const selectedOption = submittedAnswers[q.id] !== undefined ? Number(submittedAnswers[q.id]) : null;

            if (selectedOption !== null && selectedOption === q.correct_option_index) {
                scoreObtained += pts;
            }
        }

        const percentage = totalPoints > 0 ? Number(((scoreObtained / totalPoints) * 100).toFixed(2)) : 0;
        const isPassed = percentage >= passPct ? 1 : 0;

        // 5. Update attempt status atomically
        await db.execute(`
            UPDATE assessment_attempts
            SET score_obtained = ?,
                total_points = ?,
                percentage = ?,
                is_passed = ?,
                status = 'completed',
                answers_json = ?,
                submitted_at = NOW()
            WHERE id = ?
        `, [scoreObtained, totalPoints, percentage, isPassed, JSON.stringify(submittedAnswers), attempt_id]);

        res.json({
            attempt_id: Number(attempt_id),
            score_obtained: scoreObtained,
            total_points: totalPoints,
            percentage,
            is_passed: !!isPassed,
            pass_percentage: passPct,
            submitted_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Submit Assessment Error:', err);
        res.status(500).json({ error: 'Failed to submit assessment.' });
    }
});

// GET /api/assessments/:id/result/:attemptId
// Student views submission summary for their attempt.
router.get('/:id/result/:attemptId', authenticateToken, requireRole('student'), async (req, res) => {
    const { id: assessmentId, attemptId } = req.params;
    const studentId = req.user.id;

    try {
        const [attemptRows] = await db.execute(`
            SELECT a.id, a.attempt_number, a.score_obtained, a.total_points, a.percentage, 
                   a.is_passed, a.status, a.started_at, a.submitted_at,
                   ass.title as assessment_title, ass.pass_percentage
            FROM assessment_attempts a
            JOIN assessments ass ON a.assessment_id = ass.id
            WHERE a.id = ? AND a.assessment_id = ? AND a.student_id = ?
        `, [attemptId, assessmentId, studentId]);

        if (attemptRows.length === 0) {
            return res.status(404).json({ error: 'Attempt result not found.' });
        }

        const att = attemptRows[0];
        res.json({
            attempt_id: att.id,
            assessment_title: att.assessment_title,
            attempt_number: att.attempt_number,
            score_obtained: att.score_obtained,
            total_points: att.total_points,
            percentage: Number(att.percentage),
            is_passed: !!att.is_passed,
            pass_percentage: Number(att.pass_percentage),
            started_at: att.started_at,
            submitted_at: att.submitted_at
        });
    } catch (err) {
        console.error('Fetch Result Error:', err);
        res.status(500).json({ error: 'Failed to fetch assessment result.' });
    }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET /api/assessments/course/:courseId
// Admin fetch all assessments for a course with module details and question count
router.get('/course/:courseId', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
    const { courseId } = req.params;
    try {
        if (req.user.role === 'instructor') {
            const hasAccess = await verifyInstructorCourseAccess(req.user.id, courseId);
            if (!hasAccess) return res.status(403).json({ error: 'Access denied. You are not assigned to this course.' });
        }
        const [courseRows] = await db.execute(`SELECT id, name FROM courses WHERE id = ?`, [courseId]);
        if (courseRows.length === 0) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        const [assessments] = await db.execute(`
            SELECT a.*, cm.title as module_title,
                   (SELECT COUNT(*) FROM assessment_questions WHERE assessment_id = a.id) as question_count
            FROM assessments a
            LEFT JOIN course_modules cm ON a.module_id = cm.id
            WHERE a.course_id = ?
            ORDER BY a.created_at DESC
        `, [courseId]);

        // Attach questions for admin view
        for (let ass of assessments) {
            const [questions] = await db.execute(`
                SELECT id, question_text, question_type, options_json, correct_option_index, points, sequence_order
                FROM assessment_questions
                WHERE assessment_id = ?
                ORDER BY sequence_order ASC, id ASC
            `, [ass.id]);

            ass.questions = questions.map(q => ({
                ...q,
                options: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json
            }));
        }

        res.json({
            course: courseRows[0],
            assessments
        });
    } catch (err) {
        console.error('Admin Fetch Assessments Error:', err);
        res.status(500).json({ error: 'Failed to fetch course assessments.' });
    }
});

// POST /api/assessments
// Admin create new assessment
router.post('/', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
    const { course_id, module_id, title, description, pass_percentage = 70, time_limit_mins = 0, max_attempts = 3, status = 'active' } = req.body;

    if (!course_id || !title || !title.trim()) {
        return res.status(400).json({ error: 'Course ID and Assessment Title are required.' });
    }

    if (req.user.role === 'instructor') {
        const hasAccess = await verifyInstructorCourseAccess(req.user.id, course_id);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied. You are not assigned to this course.' });
    }

    const passPct = parseInt(pass_percentage);
    if (isNaN(passPct) || passPct < 0 || passPct > 100) {
        return res.status(400).json({ error: 'Pass percentage must be between 0 and 100.' });
    }

    const timeLimit = parseInt(time_limit_mins);
    if (isNaN(timeLimit) || timeLimit < 0) {
        return res.status(400).json({ error: 'Time limit must be a non-negative number.' });
    }

    const maxAtt = parseInt(max_attempts);
    if (isNaN(maxAtt) || maxAtt < 0) {
        return res.status(400).json({ error: 'Max attempts must be a non-negative number.' });
    }

    const validStatus = status === 'inactive' ? 'inactive' : 'active';

    try {
        const [courseRows] = await db.execute(`SELECT id FROM courses WHERE id = ?`, [course_id]);
        if (courseRows.length === 0) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        if (module_id) {
            const [modRows] = await db.execute(`SELECT id FROM course_modules WHERE id = ? AND course_id = ?`, [module_id, course_id]);
            if (modRows.length === 0) {
                return res.status(400).json({ error: 'Parent module not found for this course.' });
            }
        }

        const [result] = await db.execute(`
            INSERT INTO assessments (course_id, module_id, title, description, pass_percentage, time_limit_mins, max_attempts, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [course_id, module_id || null, title.trim(), description || '', passPct, timeLimit, maxAtt, validStatus]);

        const [newAssRows] = await db.execute(`SELECT * FROM assessments WHERE id = ?`, [result.insertId]);
        res.status(201).json({
            message: 'Assessment created successfully',
            assessment: { ...newAssRows[0], questions: [] }
        });
    } catch (err) {
        console.error('Create Assessment Error:', err);
        res.status(500).json({ error: 'Failed to create assessment.' });
    }
});

// PUT /api/assessments/:id
// Admin update assessment details
router.put('/:id', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
    const assessmentId = req.params.id;
    if (req.user.role === 'instructor') {
        const hasAccess = await verifyInstructorAssessmentAccess(req.user.id, assessmentId);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied. You are not assigned to this course.' });
    }
    const { title, description, pass_percentage, time_limit_mins, max_attempts, status } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Assessment Title is required.' });
    }

    const passPct = parseInt(pass_percentage);
    if (isNaN(passPct) || passPct < 0 || passPct > 100) {
        return res.status(400).json({ error: 'Pass percentage must be between 0 and 100.' });
    }

    const timeLimit = parseInt(time_limit_mins);
    if (isNaN(timeLimit) || timeLimit < 0) {
        return res.status(400).json({ error: 'Time limit must be a non-negative number.' });
    }

    const maxAtt = parseInt(max_attempts);
    if (isNaN(maxAtt) || maxAtt < 0) {
        return res.status(400).json({ error: 'Max attempts must be a non-negative number.' });
    }

    const validStatus = status === 'inactive' ? 'inactive' : 'active';

    try {
        const [existing] = await db.execute(`SELECT id FROM assessments WHERE id = ?`, [assessmentId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Assessment not found.' });
        }

        await db.execute(`
            UPDATE assessments
            SET title = ?, description = ?, pass_percentage = ?, time_limit_mins = ?, max_attempts = ?, status = ?
            WHERE id = ?
        `, [title.trim(), description || '', passPct, timeLimit, maxAtt, validStatus, assessmentId]);

        const [updatedRows] = await db.execute(`SELECT * FROM assessments WHERE id = ?`, [assessmentId]);
        res.json({ message: 'Assessment updated successfully', assessment: updatedRows[0] });
    } catch (err) {
        console.error('Update Assessment Error:', err);
        res.status(500).json({ error: 'Failed to update assessment.' });
    }
});

// DELETE /api/assessments/:id
// Admin delete assessment
router.delete('/:id', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
    const assessmentId = req.params.id;
    if (req.user.role === 'instructor') {
        const hasAccess = await verifyInstructorAssessmentAccess(req.user.id, assessmentId);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied. You are not assigned to this course.' });
    }
    try {
        const [existing] = await db.execute(`SELECT id FROM assessments WHERE id = ?`, [assessmentId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Assessment not found.' });
        }

        await db.execute(`DELETE FROM assessments WHERE id = ?`, [assessmentId]);
        res.json({ message: 'Assessment and associated questions/attempts deleted successfully.' });
    } catch (err) {
        console.error('Delete Assessment Error:', err);
        res.status(500).json({ error: 'Failed to delete assessment.' });
    }
});

// POST /api/assessments/:id/questions
// Admin add question to assessment
router.post('/:id/questions', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
    const assessmentId = req.params.id;
    if (req.user.role === 'instructor') {
        const hasAccess = await verifyInstructorAssessmentAccess(req.user.id, assessmentId);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied. You are not assigned to this course.' });
    }
    const { question_text, question_type = 'mcq', options_json, correct_option_index, points = 1, sequence_order = 1 } = req.body;

    if (!question_text || !question_text.trim()) {
        return res.status(400).json({ error: 'Question text is required.' });
    }

    const type = question_type === 'tf' ? 'tf' : 'mcq';
    let options = Array.isArray(options_json) ? options_json : [];
    if (type === 'tf') {
        options = ["True", "False"];
    }

    if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: 'At least two options are required.' });
    }

    const correctIdx = parseInt(correct_option_index);
    if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= options.length) {
        return res.status(400).json({ error: 'Valid correct option index is required.' });
    }

    const pts = parseInt(points);
    if (isNaN(pts) || pts < 1) {
        return res.status(400).json({ error: 'Points must be a positive integer.' });
    }

    const seq = parseInt(sequence_order);
    const orderNum = isNaN(seq) || seq < 1 ? 1 : seq;

    try {
        const [assRows] = await db.execute(`SELECT id FROM assessments WHERE id = ?`, [assessmentId]);
        if (assRows.length === 0) {
            return res.status(404).json({ error: 'Assessment not found.' });
        }

        const [result] = await db.execute(`
            INSERT INTO assessment_questions (assessment_id, question_text, question_type, options_json, correct_option_index, points, sequence_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [assessmentId, question_text.trim(), type, JSON.stringify(options), correctIdx, pts, orderNum]);

        const [newQRows] = await db.execute(`SELECT * FROM assessment_questions WHERE id = ?`, [result.insertId]);
        res.status(201).json({
            message: 'Question added successfully',
            question: {
                ...newQRows[0],
                options
            }
        });
    } catch (err) {
        console.error('Add Question Error:', err);
        res.status(500).json({ error: 'Failed to add question.' });
    }
});

// PUT /api/questions/:id
// Admin update question
router.put('/questions/:id', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
    const questionId = req.params.id;
    if (req.user.role === 'instructor') {
        const [qRows] = await db.execute('SELECT assessment_id FROM assessment_questions WHERE id = ?', [questionId]);
        if (qRows.length > 0) {
            const hasAccess = await verifyInstructorAssessmentAccess(req.user.id, qRows[0].assessment_id);
            if (!hasAccess) return res.status(403).json({ error: 'Access denied.' });
        }
    }
    const { question_text, question_type = 'mcq', options_json, correct_option_index, points = 1, sequence_order = 1 } = req.body;

    if (!question_text || !question_text.trim()) {
        return res.status(400).json({ error: 'Question text is required.' });
    }

    const type = question_type === 'tf' ? 'tf' : 'mcq';
    let options = Array.isArray(options_json) ? options_json : [];
    if (type === 'tf') {
        options = ["True", "False"];
    }

    if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: 'At least two options are required.' });
    }

    const correctIdx = parseInt(correct_option_index);
    if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= options.length) {
        return res.status(400).json({ error: 'Valid correct option index is required.' });
    }

    const pts = parseInt(points);
    if (isNaN(pts) || pts < 1) {
        return res.status(400).json({ error: 'Points must be a positive integer.' });
    }

    const seq = parseInt(sequence_order);
    const orderNum = isNaN(seq) || seq < 1 ? 1 : seq;

    try {
        const [existing] = await db.execute(`SELECT id FROM assessment_questions WHERE id = ?`, [questionId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Question not found.' });
        }

        await db.execute(`
            UPDATE assessment_questions
            SET question_text = ?, question_type = ?, options_json = ?, correct_option_index = ?, points = ?, sequence_order = ?
            WHERE id = ?
        `, [question_text.trim(), type, JSON.stringify(options), correctIdx, pts, orderNum, questionId]);

        const [updatedRows] = await db.execute(`SELECT * FROM assessment_questions WHERE id = ?`, [questionId]);
        res.json({
            message: 'Question updated successfully',
            question: {
                ...updatedRows[0],
                options
            }
        });
    } catch (err) {
        console.error('Update Question Error:', err);
        res.status(500).json({ error: 'Failed to update question.' });
    }
});

// DELETE /api/questions/:id
// Admin delete question
router.delete('/questions/:id', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
    const questionId = req.params.id;
    if (req.user.role === 'instructor') {
        const [qRows] = await db.execute('SELECT assessment_id FROM assessment_questions WHERE id = ?', [questionId]);
        if (qRows.length > 0) {
            const hasAccess = await verifyInstructorAssessmentAccess(req.user.id, qRows[0].assessment_id);
            if (!hasAccess) return res.status(403).json({ error: 'Access denied.' });
        }
    }
    try {
        const [existing] = await db.execute(`SELECT id FROM assessment_questions WHERE id = ?`, [questionId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Question not found.' });
        }

        await db.execute(`DELETE FROM assessment_questions WHERE id = ?`, [questionId]);
        res.json({ message: 'Question deleted successfully.' });
    } catch (err) {
        console.error('Delete Question Error:', err);
        res.status(500).json({ error: 'Failed to delete question.' });
    }
});

// GET /api/assessments/:id/results
// Admin fetch student attempt logs for an assessment
router.get('/:id/results', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
    const assessmentId = req.params.id;
    try {
        if (req.user.role === 'instructor') {
            const hasAccess = await verifyInstructorAssessmentAccess(req.user.id, assessmentId);
            if (!hasAccess) return res.status(403).json({ error: 'Access denied.' });
        }

        const [assRows] = await db.execute(`SELECT id, title FROM assessments WHERE id = ?`, [assessmentId]);
        if (assRows.length === 0) {
            return res.status(404).json({ error: 'Assessment not found.' });
        }

        let queryParams = [assessmentId];
        let filterStr = "";
        if (req.user.role === 'instructor') {
            filterStr = " AND b.instructor_id = ? ";
            queryParams.push(req.user.id);
        }

        const [attempts] = await db.execute(`
            SELECT a.id as attempt_id, a.assessment_id, a.student_id, u.name as student_name, u.email as student_email,
                   a.batch_id, b.name as batch_name, a.attempt_number, a.score_obtained, a.total_points,
                   a.percentage, a.is_passed, a.status, a.started_at, a.submitted_at
            FROM assessment_attempts a
            JOIN users u ON a.student_id = u.id
            JOIN batches b ON a.batch_id = b.id
            WHERE a.assessment_id = ? ${filterStr}
            ORDER BY a.started_at DESC
        `, queryParams);

        res.json({
            assessment: assRows[0],
            attempts
        });
    } catch (err) {
        console.error('Fetch Admin Assessment Results Error:', err);
        res.status(500).json({ error: 'Failed to fetch assessment results.' });
    }
});

module.exports = router;
