const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// POST /api/inquiries - Public: Submit a service inquiry
router.post('/', async (req, res) => {
    const { name, email, phone, service_type, message } = req.body;

    if (!name || !email || !service_type) {
        return res.status(400).json({ error: 'Name, Email, and Service Type are required' });
    }

    try {
        await db.execute(`
            INSERT INTO service_inquiries (name, email, phone, service_type, message)
            VALUES (?, ?, ?, ?, ?)
        `, [name, email, phone || null, service_type, message || null]);

        res.status(201).json({ message: 'Inquiry submitted successfully. We will contact you soon!' });
    } catch (err) {
        console.error('Inquiry Submission Error:', err);
        res.status(500).json({ error: 'Failed to submit inquiry' });
    }
});

// GET /api/inquiries - Admin only: List all inquiries
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const [inquiries] = await db.execute(`SELECT * FROM service_inquiries ORDER BY created_at DESC`);
        res.json(inquiries);
    } catch (err) {
        console.error('Fetch Inquiries Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PATCH /api/inquiries/:id - Admin only: Update status
router.patch('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'Status is required' });

    try {
        await db.execute(`UPDATE service_inquiries SET status = ? WHERE id = ?`, [status, id]);
        res.json({ message: 'Inquiry status updated' });
    } catch (err) {
        console.error('Update Inquiry Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
