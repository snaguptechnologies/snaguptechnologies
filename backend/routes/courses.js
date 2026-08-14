const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/courses - public (optionally ?all=true for admin)
router.get('/', async (req, res) => {
  const showAll = req.query.all === 'true';

  // Auto-close expired enrollments
  try {
    const nowIST = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().slice(0, 16).replace('T', ' ');
    const [info] = await db.execute(`
      UPDATE batches 
      SET enrollment_status = 'closed' 
      WHERE enrollment_status = 'open' 
        AND enrollment_end_date IS NOT NULL 
        AND enrollment_end_date <= ?
    `, [nowIST]);
    
    if (info.affectedRows > 0) {
      console.log(`[SYSTEM] Auto-closed ${info.affectedRows} expired batch enrollments at ${nowIST}`);
    }
  } catch(err) {
    console.error('[SYSTEM] Error auto-closing expired enrollments:', err);
  }

  try {
    const [courses] = await db.execute(`
      SELECT c.*,
        (SELECT COUNT(*) FROM batches WHERE course_id=c.id) as batch_count,
        (SELECT COUNT(*) FROM batches WHERE course_id=c.id AND batch_status='active') as active_batches,
        (SELECT COUNT(*) FROM batches WHERE course_id=c.id AND batch_status='upcoming') as upcoming_batches,
        (SELECT MIN(price) FROM batches WHERE course_id=c.id AND batch_status IN ('active', 'upcoming')) as starting_price,
        (SELECT MAX(duration_days) FROM batches WHERE course_id=c.id AND batch_status IN ('active', 'upcoming')) as max_duration,
        (SELECT COUNT(*) FROM batches WHERE course_id=c.id AND batch_status IN ('active','upcoming') AND enrollment_status='open') as open_batches
      FROM courses c
      ${showAll ? '' : `WHERE EXISTS (
        SELECT 1 FROM batches WHERE course_id = c.id AND batch_status IN ('active', 'upcoming')
      )`}
      ORDER BY c.created_at DESC
    `);
    
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/courses/:id - public, returns course + all its upcoming/active batches with enrollment_status
router.get('/:id', async (req, res) => {
  try {
    const [courseRows] = await db.execute(`SELECT * FROM courses WHERE id = ?`, [req.params.id]);
    const course = courseRows[0];
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    // Show all active + upcoming batches with their enrollment status
    // Frontend uses enrollment_status to decide whether to show Enroll button
    const [batches] = await db.execute(`
      SELECT b.*, u.name as instructor_name,
        (SELECT COUNT(*) FROM enrollments WHERE batch_id=b.id AND status='approved') as enrolled_count
      FROM batches b
      LEFT JOIN users u ON b.instructor_id = u.id
      WHERE b.course_id = ? 
        AND b.batch_status IN ('active', 'upcoming')
      ORDER BY b.created_at DESC
    `, [course.id]);
    
    res.json({ ...course, batches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
});

// POST /api/courses - admin only
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Course name is required' });
  
  try {
    const [result] = await db.execute(`INSERT INTO courses (name, description) VALUES (?, ?)`, [name, description || '']);
    res.status(201).json({ id: result.insertId, message: 'Course created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// PUT /api/courses/:id - admin only
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, description } = req.body;
  try {
    const [existingRows] = await db.execute(`SELECT id FROM courses WHERE id = ?`, [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Course not found' });
    
    await db.execute(`UPDATE courses SET name=?, description=? WHERE id=?`, [name, description, req.params.id]);
    res.json({ message: 'Course updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update course' });
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
