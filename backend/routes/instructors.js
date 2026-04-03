const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/instructors - admin only
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [instructors] = await db.execute(`
      SELECT id, name, email, phone, is_active, created_at
      FROM users 
      WHERE role = 'instructor'
      ORDER BY created_at DESC
    `);

    // Attach assigned batches
    for (let inst of instructors) {
      const [batches] = await db.execute(`
        SELECT b.id, b.name, b.duration_days, b.price, b.batch_status, c.name as course_name
        FROM batches b
        JOIN courses c ON b.course_id = c.id
        WHERE b.instructor_id = ?
      `, [inst.id]);
      inst.batches = batches;
    }

    res.json(instructors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch instructors' });
  }
});

// GET /api/instructors/public - public listing
router.get('/public/all', async (req, res) => {
  try {
    const [instructors] = await db.execute(`
      SELECT id, name
      FROM users 
      WHERE role = 'instructor' AND is_active = 1
    `);
    res.json(instructors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch public instructors' });
  }
});

// POST /api/instructors - admin only
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });

  try {
    const [existing] = await db.execute(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const [result] = await db.execute(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES (?, ?, ?, 'instructor', ?)
    `, [name, email.toLowerCase().trim(), hash, phone || null]);

    res.status(201).json({ id: result.insertId, message: 'Instructor created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create instructor' });
  }
});

// PUT /api/instructors/:id - admin only
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, phone, is_active } = req.body;
  try {
    await db.execute(`
      UPDATE users SET name=?, phone=?, is_active=?
      WHERE id=? AND role='instructor'
    `, [name, phone || null, is_active ? 1 : 0, req.params.id]);
    res.json({ message: 'Instructor updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update instructor' });
  }
});

module.exports = router;
