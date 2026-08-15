const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/courses - public (optionally ?all=true for admin)
router.get('/', async (req, res) => {
  try {
    const [courses] = await db.execute(`
      SELECT c.*,
        (SELECT COUNT(DISTINCT e.student_id) FROM enrollments e JOIN batches b ON e.batch_id = b.id WHERE b.course_id = c.id AND e.status = 'approved') as enrolled_students,
        (SELECT COUNT(*) FROM batches WHERE course_id=c.id) as batch_count,
        (SELECT COUNT(*) FROM batches WHERE course_id=c.id AND batch_status='active') as active_batches,
        (SELECT COUNT(*) FROM batches WHERE course_id=c.id AND batch_status='upcoming') as upcoming_batches,
        (SELECT MIN(price) FROM batches WHERE course_id=c.id) as starting_price,
        (SELECT MAX(duration_days) FROM batches WHERE course_id=c.id) as max_duration,
        (SELECT COUNT(*) FROM batches WHERE course_id=c.id AND enrollment_status='open') as open_batches
      FROM courses c
      ORDER BY c.created_at DESC
    `);
    
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/courses/:id - public, returns course + all its batches
router.get('/:id', async (req, res) => {
  try {
    const [courseRows] = await db.execute(`SELECT * FROM courses WHERE id = ?`, [req.params.id]);
    const course = courseRows[0];
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    let [batches] = await db.execute(`
      SELECT b.*,
        (SELECT COUNT(*) FROM enrollments WHERE batch_id=b.id AND status='approved') as enrolled_count
      FROM batches b
      WHERE b.course_id = ?
      ORDER BY b.created_at DESC
    `, [course.id]);

    // If course has no batch record yet, create default continuous batch for student enrollment
    if (batches.length === 0) {
      const [newBatch] = await db.execute(`
        INSERT INTO batches (course_id, name, batch_status, enrollment_status, duration_days, price)
        VALUES (?, ?, 'active', 'open', 0, 0)
      `, [course.id, `${course.name} - Default Cohort`]);
      
      const [createdBatches] = await db.execute(`
        SELECT b.*, 0 as enrolled_count FROM batches b WHERE b.id = ?
      `, [newBatch.insertId]);
      batches = createdBatches;
    }
    
    res.json({ ...course, batches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
});

// POST /api/courses - admin only
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, description, category = 'General', status = 'active', learning_objectives = '', prerequisites = '' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Course name is required' });
  
  try {
    const [result] = await db.execute(
      `INSERT INTO courses (name, description, category, status, learning_objectives, prerequisites) VALUES (?, ?, ?, ?, ?, ?)`, 
      [name.trim(), description || '', category || 'General', status || 'active', learning_objectives || '', prerequisites || '']
    );
    const courseId = result.insertId;

    // Create default active batch for seamless enrollment
    await db.execute(`
      INSERT INTO batches (course_id, name, batch_status, enrollment_status, duration_days, price)
      VALUES (?, ?, 'active', 'open', 0, 0)
    `, [courseId, `${name.trim()} - Default Cohort`]);

    const [newCourseRows] = await db.execute(`SELECT * FROM courses WHERE id = ?`, [courseId]);
    res.status(201).json({ id: courseId, message: 'Course created successfully', course: newCourseRows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// PUT /api/courses/:id - admin only
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, description, category, status, learning_objectives, prerequisites } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Course name is required' });

  try {
    const [existingRows] = await db.execute(`SELECT id FROM courses WHERE id = ?`, [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Course not found' });
    
    await db.execute(
      `UPDATE courses SET name=?, description=?, category=?, status=?, learning_objectives=?, prerequisites=? WHERE id=?`, 
      [name.trim(), description || '', category || 'General', status || 'active', learning_objectives || '', prerequisites || '', req.params.id]
    );

    const [updatedRows] = await db.execute(`SELECT * FROM courses WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Course updated successfully', course: updatedRows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// PUT /api/courses/:id/status - admin only (toggle active/inactive status)
router.put('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await db.execute(`UPDATE courses SET status = ? WHERE id = ?`, [status, req.params.id]);
    res.json({ message: `Course status updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update course status' });
  }
});

// DELETE /api/courses/:id - admin only
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await db.execute(`DELETE FROM courses WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

module.exports = router;
